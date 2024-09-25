import axios from "axios";

axios.defaults.withCredentials = true; 
const dailyApi = axios.create({
    baseURL: "http://localhost:3000/daily",
    headers:{
        "Content-Type": "multipart/form-data"
    },
})

// 取得所有個人日報
export const getAllPersonalDaily = async (config) => {
    const response = await dailyApi.get("/", config);
    return response.data;
}

// 建立個人日報
export const createPersonalDaily = async (data) => {
    const response = await dailyApi.post("/", data);
    return response.data;
}

// 修改個人日報
export const updatePersonalDaily = async (id, data) => {
    const response = await dailyApi.put(`/${id}`, data);
    return response.data;
}

// 取得所有團隊日報
export const getAllTeamDaily = async (config) => {
    const response = await dailyApi.get("/team", config);
    return response.data;
}

// 建立團隊日報
export const createTeamDaily = async (config) => {
    const response = await dailyApi.post("/team", config);
    return response.data;
}

// 修改團隊日報
export const updateTeamDaily = async (id, data) => {
    const response = await dailyApi.put(`/team/${id}`, data);
    return response.data;
}