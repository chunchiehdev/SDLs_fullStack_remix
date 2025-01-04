import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import AssignMember from './AssignMember';
import { getProjectUser } from '../../../api/users';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import Swal from 'sweetalert2';
import { GrFormClose } from "react-icons/gr";
import { FiEdit } from "react-icons/fi";
import { BsFillPersonFill } from "react-icons/bs";
import { Draggable } from 'react-beautiful-dnd';
import { socket } from '../../../utils/socket';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

function Carditem({ data, index, columnIndex }) {
  const [open, setOpen] = useState(false);
  const [assignMemberModalopen, setAssignMemberModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // 用於模態框顯示圖片
  const { projectId } = useParams();
  const [cardData, setCardData] = useState({
    id: "",
    title: "",
    content: "",
    labels: [],
    assignees: [],
    columnId: "",
    images: [],
    files: []
  });

  const personImg = [
    '/public/person/man1.png', '/public/person/man2.png', '/public/person/man3.png',
    '/public/person/man4.png', '/public/person/man5.png', '/public/person/man6.png',
    '/public/person/woman1.png', '/public/person/woman2.png', '/public/person/woman3.png'
  ];

  const [menberData, setMenberData] = useState([]);

  useQuery("getProjectUser", () => getProjectUser(projectId), {
    onSuccess: setMenberData,
    enabled: !!projectId
  });

  useEffect(() => {
    setCardData({
      ...data,
      images: data.images || [], // 確保 images 為陣列
      files: data.files || [] // 確保 files 為陣列
    });
  }, [data]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedFiles = response.data.files.filter(file => !file.mimeType.startsWith('image/'));
      const uploadedImages = response.data.files.filter(file => file.mimeType.startsWith('image/'));

      setCardData((prev) => ({
        ...prev,
        files: Array.isArray(prev.files) ? [...prev.files, ...uploadedFiles] : [...uploadedFiles],
        images: Array.isArray(prev.images) ? [...prev.images, ...uploadedImages.map(file => file.url)] : [...uploadedImages.map(file => file.url)],
      }));

      toast.success('檔案上傳成功');
    } catch (err) {
      console.error('檔案上傳失敗:', err);
      toast.error('檔案上傳失敗');
    }
  };

  const removeFile = (index) => {
    setCardData((prev) => {
      const newFiles = [...prev.files];
      newFiles.splice(index, 1);
      return { ...prev, files: newFiles };
    });
  };

  const removeImage = (index) => {
    setCardData((prev) => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const cardHandleSubmit = () => {
    if (cardData.title.trim() !== "") {
      socket.emit("cardUpdated", { cardData, columnIndex, index, projectId });
      setOpen(false);
    } else {
      toast.error("請填寫卡片標題!");
    }
  };

  const cardHandleDelete = () => {
    Swal.fire({
      title: "刪除",
      text: "確定要刪除卡片嗎?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#5BA491",
      cancelButtonColor: "#d33",
      confirmButtonText: "確定",
      cancelButtonText: "取消"
    }).then((result) => {
      if (result.isConfirmed) {
        socket.emit("cardDelete", { cardData, columnIndex, index, projectId });
        setOpen(false);
      }
    });
  };
  const Tooltip = ({ children, content }) => {
    return (
      <div className='relative group'>
        {children}
        <div className='absolute  hidden group-hover:block'>
          <div className='bg-gray-700 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap'>
            {content}
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      <Draggable draggableId={data.id.toString()} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`item-container p-2 rounded-lg mb-2 w-full shadow-lg hover:skew-y-2 ${snapshot.isDragging ? "dragging bg-customgreen/90 text-white" : "bg-white"}`}
          >
            {cardData.images && cardData.images.length > 0 && (
                <div className="relative">
                    <img
                        src={`http://localhost:3000${cardData.images[0]}`} // 確保路徑完整
                        alt="Card Background"
                        className="w-full h-32 object-cover rounded-t-lg cursor-pointer"
                        onClick={() => setSelectedImage(`http://localhost:3000${cardData.images[0]}`)}
                    />
                </div>
            )}

            <div className="p-2">
              <div className="flex justify-between">
                <p className="text-base font-semibold truncate" style={{ maxWidth: "150px" }}>
                  {data.title}
                </p>
                <FiEdit onClick={() => setOpen(true)} className="w-5 h-5 cursor-pointer" />
              </div>
              <div>
                <p className="truncate">{data.content}</p>
              </div>
              <div className="flex justify-end items-center space-x-1">
                {data.assignees?.map((assignee, index) => {
                  const imgIndex = parseInt(assignee.id) % personImg.length;
                  const userImg = personImg[imgIndex];
                  return (
                    <img
                      key={index}
                      src={userImg}
                      alt="Person"
                      className="w-8 h-8 my-1 overflow-hidden rounded-full shadow-xl object-cover"
                      title={assignee.username}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {/* 模態框顯示圖片大圖 */}
      {selectedImage && (
        <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Selected" className="w-full h-auto" />
        </Modal>
      )}

      {cardData && (
        <Modal open={open} onClose={() => setOpen(false)} opacity={true} position={"justify-center items-center"}>
          <div className='flex justify-between'>
            <div className='flex flex-col w-2/3'>
              <input
                className="rounded outline-none ring-2 p-1 ring-customgreen w-full mb-3"
                type="text"
                placeholder="title"
                name='title'
                value={cardData.title}
                onChange={(e) => setCardData({ ...cardData, title: e.target.value })}
              />
              <textarea
                className="rounded outline-none ring-2 ring-customgreen w-full p-1"
                rows={3}
                placeholder="Task info"
                name='content'
                value={cardData.content}
                onChange={(e) => setCardData({ ...cardData, content: e.target.value })}
              />
            </div>
            <div className='flex flex-col w-1/3 ml-4'>
              <button
                onClick={() => setAssignMemberModalOpen(true)}
                className="flex justify-start items-center w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60"
              >
                <BsFillPersonFill className='w-3 h-3 sm:w-5 sm:h-5 mx-2 text-black' />
                指派成員
              </button>
              <div className="mt-3">
                <label className="block font-bold mb-1">上傳檔案：</label>
                <input type="file" multiple onChange={handleFileUpload} />
              </div>
            </div>
          </div>

          <div className='flex flex-wrap mt-3'>
            {cardData.images?.map((image, index) => (
              <div key={index} className='relative m-1'>
                <img src={image} alt="Uploaded" className='w-20 h-20 object-cover rounded shadow-md' />
                <button
                  onClick={() => removeImage(index)}
                  className='absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full p-1'
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <p className="flex justify-start items-center w-full h-7 m-1 font-bold text-sm sm:text-base text-black/60">
        指派成員
      </p>
      <div className='flex flex-row'>
        {
          cardData.assignees &&
          cardData.assignees.map((assignee, index) => {
            const imgIndex = parseInt(assignee.id) % 9;
            const userImg = personImg[imgIndex];
            return (
              <Tooltip key={index} children={""} content={`${assignee.username}`}>
                <div className="relative w-8 h-8 rounded-full shadow-xl">
                  <img src={userImg} alt="Person" className="w-8 h-8 overflow-hidden rounded-full shadow-xl object-cover" />
                </div>
              </Tooltip>
            )
          })
        }
      </div>

          <div className='flex justify-between mt-2'>
            <button
              className="flex justify-center items-center w-full h-7 mb-2 bg-[#fa3c3c] rounded font-bold text-xs sm:text-sm text-white mr-2"
              onClick={cardHandleDelete}
            >
              刪除
            </button>
            <button
              className="flex justify-center items-center w-full h-7 mb-2 bg-customgreen rounded font-bold text-xs sm:text-sm text-white mr-2"
              onClick={cardHandleSubmit}
            >
              儲存
            </button>
            <button
              className="flex justify-center items-center w-full h-7 mb-2 bg-customgray rounded font-bold text-xs sm:text-sm text-black/60 mr-2"
              onClick={() => setOpen(false)}
            >
              取消
            </button>
          </div>
        </Modal>
      )}

      <Modal open={assignMemberModalopen} onClose={() => setAssignMemberModalOpen(false)} opacity={false} position={"justify-end items-center m-3"}>
        <button onClick={() => setAssignMemberModalOpen(false)} className='absolute top-1 right-1 rounded-lg bg-white hover:bg-slate-200'>
          <GrFormClose className='w-6 h-6' />
        </button>
        <AssignMember menberData={menberData} setMenberData={setMenberData} setCardData={setCardData} cardHandleSubmit={cardHandleSubmit} />
      </Modal>

      <Toaster />
    </>
  );
}

export default React.memo(Carditem);
