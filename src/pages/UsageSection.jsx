import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'styles/UsageSection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const UsageSection = () => {
  const [filters, setFilters] = useState({
    phoneNumber: '',
    month: ''
  });

  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [phoneOptions, setPhoneOptions] = useState([]); // 전화번호 목록
  const [planInfoMap, setPlanInfoMap] = useState({});   // phoneNumber → plan info

  const getToken = () => localStorage.getItem('accessToken');

  // 최초 로드: 디폴트 월 설정 + 사용자 요금제 정보 불러오기
  useEffect(() => {
    const today = new Date();
    const defaultMonth = today.toISOString().slice(0, 7);
    setFilters(prev => ({ ...prev, month: defaultMonth }));

    fetchCurrentMonthUsage();
    fetchUserPlans(); // 전화번호, 요금제 이름/가격 매핑
  }, []);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchUserPlans = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_BASE_URL}/api/user-plans`, {
        headers: { 'X-AUTH-TOKEN': token }
      });

      const phones = res.data.data.map(p => p.phoneNumber);
      const map = {};
      res.data.data.forEach(p => {
        map[p.phoneNumber] = {
          planName: p.planName,
          price: p.discountedPrice
        };
      });

      setPhoneOptions(phones);
      setPlanInfoMap(map);
    } catch (e) {
      console.warn('요금제 정보 불러오기 실패:', e);
    }
  };

  const fetchCurrentMonthUsage = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/usages/current`, {
        headers: { 'X-AUTH-TOKEN': getToken() }
      });
      setUsages(res.data.data || []);
    } catch (err) {
      alert('기본 사용량 조회 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      let url = '';
      let params = {};
      let filterPhone = '';

      const { phoneNumber, month } = filters;

      if (phoneNumber && month) {
        const [year, monthNum] = month.split('-');
        url = '/api/usages/month';
        params = { year, month: monthNum };
        filterPhone = phoneNumber;
      } else if (month) {
        const [year, monthNum] = month.split('-');
        url = '/api/usages/month';
        params = { year, month: monthNum };
      } else {
        url = '/api/usages/all';
      }

      const res = await axios.get(`${API_BASE_URL}${url}`, {
        headers: { 'X-AUTH-TOKEN': getToken() },
        params
      });

      let result = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      if (filterPhone) {
        result = result.filter(u => u.phoneNumber === filterPhone);
      }

      setUsages(result);
    } catch (error) {
      alert('조회 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="usage-section">
      <h3 className="usage-title">사용량 조회</h3>

      <div className="usage-filter-box">
        <select
          name="phoneNumber"
          value={filters.phoneNumber}
          onChange={handleInputChange}
        >
          <option value="">전체 번호</option>
          {phoneOptions.map((num, idx) => (
            <option key={idx} value={num}>{num}</option>
          ))}
        </select>

        <input
          type="month"
          name="month"
          value={filters.month}
          onChange={handleInputChange}
          placeholder="조회 월"
        />

        <button onClick={fetchUsageData}>조회</button>
      </div>

      {loading ? (
        <p>📡 로딩 중...</p>
      ) : usages.length === 0 ? (
        <p>🔍 조회 결과가 없습니다.</p>
      ) : (
        <table className="usage-table">
          <thead>
            <tr>
              <th>요금제 이름</th>
              <th>할인가</th>
              <th>전화번호</th>
              <th>월</th>
              <th>데이터</th>
              <th>통화</th>
              <th>문자</th>
            </tr>
          </thead>
          <tbody>
            {usages.map((u, idx) => {
              const planInfo = planInfoMap[u.phoneNumber] || {};
              return (
                <tr key={idx}>
                  <td>{planInfo.planName || 'N/A'}</td>
                  <td>{planInfo.price ? `${planInfo.price}원` : 'N/A'}</td>
                  <td>{u.phoneNumber}</td>
                  <td>{`${u.year}-${String(u.month).padStart(2, '0')}`}</td>
                  <td>{u.data} MB</td>
                  <td>{u.callMinute} 분</td>
                  <td>{u.message} 건</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsageSection;
