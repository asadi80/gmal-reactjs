/* eslint-disable jsx-a11y/iframe-has-title */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Base64 } from "js-base64";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  MDBBtn,
  MDBListGroup,
  MDBListGroupItem,
  MDBContainer,
} from "mdb-react-ui-kit";

const apiUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
var msgId;

const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return false;
  }
};

export const Mail = () => {
  const navigate = useNavigate();
  const notify = (msg) => toast(msg, { theme: "light" });

  const [allMessages, setAllMessages] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [emailInfo, setEmailInfo] = useState("");
  const [displayMessage, setDisplayMessage] = useState("none");
  const [displayAllMessage, setDisplayAllMessage] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("items");
    if (isTokenExpired(storedToken)) {
      navigate("/signin");
      console.log("Token has expired");
    } else {
      setAccessToken(storedToken);
    }
  }, [navigate]);

  useEffect(() => {
    if (accessToken) {
      getAllMessages(accessToken);
    }
  }, [accessToken]);

  const getAllMessages = async (accessToken) => {
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const messageHeaders = response.data.messages;
      const messagesInfo = await Promise.all(
        messageHeaders.map(async (message) => {
          const messageInfo = await getMessageInfo(message.id, accessToken);
          return extractMessageHeaders(messageInfo);
        })
      );
      setAllMessages(messagesInfo);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const getMessageInfo = async (messageId) => {
    try {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
      return null;
    }
  };

  const getMessageBody = async (messageId) => {
    try {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const handleEmailData = (data) => {
        if (data) {
          const decoded = Base64.decode(data);
          console.log(decoded);
          setEmailInfo(decoded);
          setDisplayMessage("");
          setDisplayAllMessage("none");
        }
      };
      console.log(response.data);
      // Handle main body data
      msgId = response.data.id
      const payload = response.data.payload;
      if (payload.body.data) {
        console.log("--------> 0", payload.body.data);
        handleEmailData(payload.body.data);
      }

      if (payload.parts && payload.parts.length > 0) {
        payload.parts.forEach((part, index) => {
          const bodyData = part.body.data;
          if (bodyData) {
            console.log("-------->", index);
            handleEmailData(bodyData);
          }

          const subParts = part.parts;
          if (subParts && subParts.length > 0) {
            subParts.forEach((subPart, subIndex) => {
              const subBodyData = subPart.body.data;
              if (subBodyData) {
                console.log("-------->", index + "." + subIndex);
                handleEmailData(subBodyData);
              }
            });
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
    }
  };

  const extractMessageHeaders = (messageInfo) => {
    if (!messageInfo) return null;
    const messageHeaders = {};
    messageHeaders["id"] = messageInfo.id;

    messageInfo.payload.headers.forEach((header) => {
      if (
        header.name === "Date" ||
        header.name === "From" ||
        header.name === "Subject"
      ) {
        if (header.name === "Date") {
          messageHeaders[header.name] = format(
            new Date(header.value),
            "MM-dd-yyyy"
          );
        } else {
          messageHeaders[header.name] = header.value;
        }
      }
    });
    return messageHeaders;
  };

  const deleteMessage = async (messageId) => {
    console.log(messageId);
    try {
      await axios.delete(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      notify("The email has been deleted");
      const newList = allMessages.filter((item) => item.id !== messageId);

      setAllMessages(newList);
      setDisplayMessage("none");
      setDisplayAllMessage("");
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
    }
  };

  const sendMessageToTrash = async (messageId) => {
    try {
      await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      notify("The email has been sent to trash");
      const newList = allMessages.filter((item) => item.id !== messageId);

      setAllMessages(newList);
      setDisplayMessage("none");
      setDisplayAllMessage("");
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
    }
  };

  return (
    <MDBContainer fluid className="d-flex flex-row mt-2 w-100">
      <MDBContainer className="w-25">
        <MDBListGroup style={{ minWidth: "15rem" }} light>
          <MDBListGroupItem
            onClick={() => {
              setDisplayMessage("none");
              setDisplayAllMessage("");
            }}
            noBorders
            color="primary"
            className="px-3 hover-shadow mb-2 rounded-3"
            style={{ cursor: "pointer" }}
          >
            Inbox
          </MDBListGroupItem>
        </MDBListGroup>
      </MDBContainer>
      <MDBContainer
        style={{ display: displayAllMessage }}
        className="rounded-3 border shadow-2"
      >
        <MDBListGroup light>
          {allMessages.map((message, index) => (
            <MDBListGroupItem
              style={{ cursor: "pointer" }}
              className="d-flex justify-content-between "
              key={index}
              onClick={() => {
                getMessageBody(message.id);
              }}
            >
              <div>
                <div className="fw-bold">{message && message.From}</div>
                <div className="text-muted">
                  {message && message.Subject}
                  <div></div>
                </div>
              </div>
            </MDBListGroupItem>
          ))}
        </MDBListGroup>
      </MDBContainer>
      <MDBContainer
        style={{ display: displayMessage, height: "2000px" }}
        className="rounded-3 border shadow-2"
      >
        <div className="mt-2 mb-2">
          <MDBBtn
            color="success"
            onClick={() => {
              sendMessageToTrash(msgId);
            }}
          >
            Trash
          </MDBBtn>
          <MDBBtn
            className="mx-2"
            color="danger"
            onClick={() => {
              deleteMessage(msgId);
            }}
          >
            Delete
          </MDBBtn>
        </div>
        <iframe srcDoc={emailInfo} style={{ width: "100%", height: "100%" }}>
          {emailInfo}
        </iframe>
      </MDBContainer>
    </MDBContainer>
  );
};
