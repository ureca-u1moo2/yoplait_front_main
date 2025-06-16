// // components/ReviewModal.jsx
// import React, { useState } from 'react';
// import axios from 'axios';
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// const ReviewModal = ({ planId, onClose }) => {
//   const [content, setContent] = useState('');
//   const [rating, setRating] = useState(5);

//   const handleSubmit = async () => {
//     try {
//       await axios.post(`${API_BASE_URL}/api/plans/${planId}/reviews`, 
//         { content, rating },
//         {
//             headers: {
//                 'X-AUTH-TOKEN': localStorage.getItem('accessToken')
//             }
//         }
//     );
//       alert('리뷰가 등록되었습니다.');
//       onClose();
//     } catch (e) {
//       alert('리뷰 등록 실패');
//     }
//   };

//   return (
//     <div style={{ position: 'fixed', top: '30%', left: '30%', background: '#fff', padding: '1rem', border: '1px solid black' }}>
//       <h3>리뷰 작성</h3>
//       <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="리뷰 내용" /><br/>
//       <select value={rating} onChange={e => setRating(Number(e.target.value))}>
//         {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}점</option>)}
//       </select><br/>
//       <button onClick={handleSubmit}>제출</button>
//       <button onClick={onClose}>취소</button>
//     </div>
//   );
// };

// export default ReviewModal;
