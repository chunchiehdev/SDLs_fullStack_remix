// frontend api for rag.js
import axios from "axios";

const ragApi = axios.create({
    baseURL: "https://science.lazyinwork.com/api/rag_message",
    headers: {
        "Content-Type": "application/json"
    },
})

export const getRAGHistory = async (userId) => {
    const response = await ragApi.get(`/history/${userId}`);
    return response.data;
}

export const getRagMessageHistory = async (userId) => {
    const response = await ragApi.get(`/history/${userId}`);
    return response.data;
}