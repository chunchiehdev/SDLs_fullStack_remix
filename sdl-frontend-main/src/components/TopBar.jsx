import React, { useState, useEffect, useContext } from 'react';
import { IoIosNotificationsOutline } from "react-icons/io";
import { BsChevronDown, BsPlusCircleDotted } from "react-icons/bs";
import { TbBell } from "react-icons/tb"; // 引入鈴鐺圖示
import { AiOutlineDashboard } from "react-icons/ai"; // 引入專案總覽圖示(原)
import { LuLayoutDashboard } from "react-icons/lu";
import { getProjectUser } from '../api/users';
import { getProject } from '../api/project';
import { getAnnouncements, createAnnouncement } from '../api/announcement';
import { useQuery } from 'react-query';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { GrFormClose } from "react-icons/gr";
import Modal from './Modal';
import Swal from 'sweetalert2';
import { socket } from '../utils/socket';
import { Context } from '../context/context';

export default function TopBar() {
  const [projectUsers, setProjectUsers] = useState([{ id: "", username: "" }]);
  const [projectInfo, setProjectInfo] = useState({});
  const [referralCodeModalOpen, setReferralCodeModalOpen] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null); // 用於存儲當前選中的公告
  const [projectList, setProjectList] = useState([]);

  const handleAnnouncementClick = (announcement) => {
      setSelectedAnnouncement(announcement); // 設置當前公告
  };

  // 關閉公告詳情模態框
  const handleCloseAnnouncementModal = () => {
      setSelectedAnnouncement(null);
  };

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newNotificationModalOpen, setNewNotificationModalOpen] = useState(false); // 控制新增公告的 Modal

  const role = localStorage.getItem("role") || "guest"; // 預設值為 "guest"，避免空值
  const { currentStageIndex, setCurrentStageIndex, currentSubStageIndex, setCurrentSubStageIndex } = useContext(Context);

  const getProjectUserQuery = useQuery("getProjectUser", () => getProjectUser(projectId), {
    onSuccess: setProjectUsers,
    enabled: !!projectId,
  });

  const getProjectQuery = useQuery("getProject", () => getProject(projectId), {
    onSuccess: (data) => {
      setProjectInfo(data);// 保存當前專案資訊
      setProjectList([data]); // 填充 projectList，只包含當前專案
      localStorage.setItem('currentStage', data.currentStage);
      localStorage.setItem('currentSubStage', data.currentSubStage);
      setCurrentStageIndex(data.currentStage);
      setCurrentSubStageIndex(data.currentSubStage);
    },
    enabled: !!projectId,
  });

  const cleanStage = () => {
    localStorage.removeItem('currentStage');
    localStorage.removeItem('currentSubStage');
    localStorage.removeItem('stageEnd');
  };

  const handleLogout = () => {
    Swal.fire({
      title: "登出",
      text: "確定要登出嗎?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#5BA491",
      cancelButtonColor: "#d33",
      confirmButtonText: "確定",
      cancelButtonText: "取消",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        socket.disconnect();
        navigate("/");
      }
    });
  };

  const handleNotificationClick = (id) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    setNotifications(updatedNotifications);
  };

  const handleAddNotification = () => {
    setNewNotificationModalOpen(true);
  };

  // 發佈公告
  const handleSaveNotification = async (newTitle, newDescription) => {
    const payload = {
        title: newTitle,
        content: newDescription,
        author: localStorage.getItem('username') || "Unknown Author",
        projectId: selectedGroup || 'all',
    };

    try {
        console.log("即將發送的公告數據:", payload);
        const newAnnouncement = await createAnnouncement(payload);
        setNotifications((prev) => [...prev, newAnnouncement]);
        setNewNotificationModalOpen(false);
    } catch (error) {
        console.error("公告發佈失敗:", error);
        Swal.fire({
            title: "公告發佈失敗",
            text: error.response?.data?.message || error.message || "請稍後再試",
            icon: "error",
        });
    }
};

useEffect(() => {
  if (projectId) {
      console.log(`加入房間: ${projectId}`);
      socket.emit('join_project', projectId); // 加入專案房間

      socket.on('receiveAnnouncement', (data) => {
          console.log("收到公告:", data);
          setNotifications((prev) => [...prev, data]);
      });

      return () => {
          console.log(`離開房間: ${projectId}`);
          socket.off('receiveAnnouncement'); // 清除事件監聽
      };
  }
}, [projectId]);

// 載入公告列表
useEffect(() => {
  async function fetchAnnouncements() {
      try {
          console.log("正在載入公告列表...");
          const announcements = await getAnnouncements();
          console.log("公告列表載入成功:", announcements);
          setNotifications(announcements); // 更新公告狀態
      } catch (error) {
          console.error("公告載入失敗:", error);
      }
  }

  fetchAnnouncements();
}, []); // 移除 projectId 的依賴

  if (location.pathname === "/homepage") {
    return (
      <div className="fixed z-40 h-16 w-full bg-[#FFFFFF] flex items-center justify-between pr-5 border-b-2">
        <Link to="/homepage" className="flex px-5 items-center font-bold font-Mulish text-2xl">
          <img src="/SDLS_LOGOO.jpg" alt="Logo" className="h-14 w-auto" />
        </Link>
        <div className="flex items-center">
          <h3 className="font-bold p-1 mr-2 rounded-lg mx-3">
            {localStorage.getItem("username")}
          </h3>
          <div className="relative flex items-center">
          <button
            className="flex items-center justify-center mr-4 cursor-pointer"
            onClick={() => navigate("/overView")}
          >
            <LuLayoutDashboard size={24} />
          </button>
          </div>
          <div className="relative">
            <TbBell size={24} className="ml-2 cursor-pointer" onClick={() => setShowNotifications(!showNotifications)} />
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">通知</h3>
                  <div className="max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                          <div 
                              key={`${notification.id}-${index}`} // 為重複的 id 添加索引作為補充
                              className="flex items-center mb-2 p-2 border-b cursor-pointer"
                              onClick={() => setSelectedAnnouncement(notification)} // 點擊後設置選中的公告
                          >
                              <h4 className="text-sm font-bold">{notification.title}</h4>
                              <p className="text-xs text-gray-500 truncate">{notification.content || "沒有內容"}</p>
                          </div>
                      ))
                  ) : (
                      <p className="text-gray-500">目前沒有任何公告。</p>
                  )}
                  </div>
                  {/* 老師角色顯示新增公告按鈕 */}
                  {role === "teacher" && (
                    <button
                      className="w-full mt-2 py-2 bg-[#5BA491] text-white text-sm font-semibold rounded-lg hover:bg-[#5BA491]"
                      onClick={() => {
                        console.log('新增公告按鈕被觸發');
                        handleAddNotification();
                      }}
                    >
                      + 新公告
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="ml-3 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-md p-2 font-semibold">
            登出
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-40 h-16 w-full bg-[#FFFFFF] flex items-center justify-between pr-5 border-b-2">
      {/* 左側 LOGO 與專案名稱 */}
      <div className="flex items-center">
        <Link to="/homepage" className="flex px-5 items-center font-bold font-Mulish text-2xl">
          <img src="/SDLS_LOGOO.jpg" alt="Logo" className="h-14 w-auto" />
        </Link>
        <p className="font-bold text-xl text-teal-900">{projectInfo.name || "專案名稱"}</p>
      </div>

      {/* 右側功能 */}
      <div className="flex items-center">
        <h3 className="font-bold cursor-pointer p-1 mr-2 rounded-lg mx-3">
          {localStorage.getItem("username")}
        </h3>
        <TbBell
          size={24}
          className="ml-2 cursor-pointer"
          onClick={() => setShowNotifications(!showNotifications)}
        />
        {showNotifications && (
          <div
            style={{
              position: "absolute",
              right: "10px",
              top: "50px",
              width: "300px",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">通知</h3>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div
                      key={`${notification.id}-${index}`}
                      className="flex items-center mb-2 p-2 border-b cursor-pointer"
                      onClick={() => setSelectedAnnouncement(notification)}
                    >
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      )}
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">{notification.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{notification.content || "沒有內容"}</p>
                    </div>
                  </div>
                  ))
                ) : (
                  <p className="text-gray-500">目前沒有任何公告。</p>
                )}
              </div>
              {role === "teacher" && (
                <button
                  className="w-full mt-2 py-2 bg-[#5BA491] text-white text-sm font-semibold rounded-lg hover:bg-[#5BA491]"
                  onClick={() => {
                    console.log('新增公告按鈕被觸發');
                    handleAddNotification();
                  }}
                >
                  + 新公告
                </button>
              )}
            </div>
          </div>
        )}
        <button
          className="ml-3 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-md p-2 font-semibold"
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
        >
          登出
        </button>
      </div>

      {/* 新增公告 Modal */}
      <Modal open={newNotificationModalOpen} onClose={() => setNewNotificationModalOpen(false)}>
        <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
          <h3 className="text-2xl font-semibold mb-6 text-center">新增公告</h3>
          <form>
            <div className="mb-4">
              <label htmlFor="groupSelect" className="block text-sm font-medium text-gray-700 mb-1">
                選擇組別
              </label>
              <select
                id="groupSelect"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="all">全部組別</option>
                {projectList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="newTitle" className="block text-sm font-medium text-gray-700 mb-1">
                標題
              </label>
              <input
                type="text"
                id="newTitle"
                placeholder="請輸入公告標題"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 mb-1">
                內容
              </label>
              <textarea
                id="newDescription"
                placeholder="請輸入公告內容"
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg"
              ></textarea>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                onClick={() => setNewNotificationModalOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-[#5BA491] text-white rounded-lg hover:bg-[#5BA491]"
                onClick={() => {
                  const newTitle = document.getElementById("newTitle").value;
                  const newDescription = document.getElementById("newDescription").value;
                  handleSaveNotification(newTitle, newDescription);
                }}
              >
                發佈
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 公告詳情 Modal */}
      {selectedAnnouncement && (
        <Modal open={true} onClose={() => setSelectedAnnouncement(null)}>
          <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
            <h3 className="text-2xl font-semibold mb-4">{selectedAnnouncement.title}</h3>
            <p className="text-gray-700 mb-4">{selectedAnnouncement.content}</p>
            <div className="text-right">
              <button
                className="px-4 py-2 bg-[#5BA491] text-white rounded-lg hover:bg-[#5BA491]"
                onClick={() => setSelectedAnnouncement(null)}
              >
                關閉
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}