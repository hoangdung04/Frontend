import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Row, Col, Card, Statistic, Table, Typography, Tag, message, Input, Select, Button, Divider } from "antd";
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  GlobalOutlined, 
  TeamOutlined,
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { getAdminDashboard, adminMe } from "../../../services/api";
import dayjs from "dayjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const { Title } = Typography;

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ 
    statistic: {}, 
    revenueStats: { today: 0, todayCount: 0, week: 0, weekCount: 0, month: 0, monthCount: 0, year: 0, yearCount: 0 },
    monthlyRevenue: [],
    statusDistribution: [],
    topTours: [],
    allOrders: [] 
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    status: ""
  });

  useEffect(() => {
    const checkRoleAndFetch = async () => {
      setLoading(true);
      try {
        // 1. Kiểm tra phân quyền từ API me
        const meRes = await adminMe();
        if (meRes.data && meRes.data.role) {
          const role = meRes.data.role;
          const isAdmin = 
            role.title === "Quản Trị Viên" || 
            role.title === "Admin" || 
            role.title === "Super Admin" || 
            (role.permissions && role.permissions.includes("roles_permissions"));
            
          if (!isAdmin) {
            message.warning("Tài khoản nhân viên không có quyền xem dashboard thống kê. Đã chuyển hướng tới danh sách tour.");
            navigate("/admin/tours", { replace: true });
            return;
          }
        }

        // 2. Nếu là Super Admin thì tiến hành tải dữ liệu dashboard
        const res = await getAdminDashboard();
        if (res.data.code === "success") {
          setData({
            statistic: res.data.statistic || {},
            revenueStats: res.data.revenueStats || { today: 0, todayCount: 0, week: 0, weekCount: 0, month: 0, monthCount: 0, year: 0, yearCount: 0 },
            monthlyRevenue: res.data.monthlyRevenue || [],
            statusDistribution: res.data.statusDistribution || [],
            topTours: res.data.topTours || [],
            allOrders: res.data.allOrders || []
          });
        } else {
          setData(res.data);
        }
      } catch (error) {
        message.error("Lỗi xác thực hoặc tải dữ liệu thống kê tổng quan");
      } finally {
        setLoading(false);
      }
    };

    checkRoleAndFetch();
  }, []);

  const { statistic, revenueStats, allOrders, monthlyRevenue, statusDistribution, topTours } = data;

  const handleReset = () => {
    setFilters({
      keyword: "",
      status: ""
    });
  };

  const renderStatus = (status) => {
    switch (status) {
      case "initial": return <Tag color="blue">Khởi tạo</Tag>;
      case "paid": return <Tag color="green">Đã thanh toán</Tag>;
      case "completed": return <Tag color="purple">Hoàn thành</Tag>;
      case "cancelled": return <Tag color="red">Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const filteredOrders = (allOrders || []).filter((order) => {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase().trim();
      const code = (order.code || "").toLowerCase();
      const fullName = (order.fullName || "").toLowerCase();
      const phone = (order.phone || "").toLowerCase();
      if (!code.includes(kw) && !fullName.includes(kw) && !phone.includes(kw)) {
        return false;
      }
    }
    if (filters.status) {
      if (order.status !== filters.status) {
        return false;
      }
    }
    return true;
  });

  const columns = [
    { 
      title: "Mã đơn", 
      dataIndex: "code", 
      key: "code",
      render: (code) => <b style={{ color: "#00b96b" }}>{code}</b>,
    },
    { title: "Khách hàng", dataIndex: "fullName", key: "fullName" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Số Tour",
      dataIndex: "totalTours",
      key: "totalTours",
      align: "center",
      render: (v) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (price) => (
        <span style={{ color: "#f5222d", fontWeight: "bold" }}>
          {Number(price || 0).toLocaleString()}đ
        </span>
      ),
    },
    { 
      title: "Ngày đặt", 
      dataIndex: "createdAt", 
      key: "createdAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm")
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: renderStatus
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Link to={`/admin/orders/${record.id}`}>
          <Button type="default" icon={<EyeOutlined />} size="small" />
        </Link>
      ),
    },
  ];

  // Cấu hình Biểu đồ Doanh thu (12 tháng gần nhất)
  const revenueChartData = {
    labels: (monthlyRevenue || []).map(item => {
      const [year, month] = item.month.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Doanh thu',
        data: (monthlyRevenue || []).map(item => item.revenue),
        borderColor: '#00b96b',
        backgroundColor: 'rgba(0, 185, 107, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#00b96b',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00b96b',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        titleColor: '#fff',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
            }
            const index = context.dataIndex;
            const count = (monthlyRevenue || [])[index]?.count || 0;
            return [label, `Số đơn hoàn thành: ${count} đơn`];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#8c8c8c'
        }
      },
      y: {
        grid: {
          color: '#f0f0f0'
        },
        ticks: {
          color: '#8c8c8c',
          callback: (value) => {
            if (value >= 1e6) return `${(value / 1e6).toFixed(0)} triệu`;
            if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
            return value;
          }
        }
      }
    }
  };

  // Cấu hình Biểu đồ Phân bổ Trạng thái Đơn hàng
  const statusColors = {
    initial: '#1890ff',
    paid: '#52c41a',
    completed: '#722ed1',
    cancelled: '#ff4d4f'
  };

  const statusChartData = {
    labels: (statusDistribution || []).map(item => item.label),
    datasets: [
      {
        data: (statusDistribution || []).map(item => item.count),
        backgroundColor: (statusDistribution || []).map(item => statusColors[item.status] || '#8c8c8c'),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const chartData = chart.data;
            if (chartData.labels.length && chartData.datasets.length) {
              return chartData.labels.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                const value = chartData.datasets[0].data[i] || 0;
                return {
                  text: `${label}: ${value} đơn`,
                  fillStyle: style.backgroundColor,
                  strokeStyle: style.borderColor,
                  lineWidth: style.borderWidth,
                  hidden: !chart.getDataVisibility(i),
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.raw;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${value} đơn (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  // Cấu hình cột cho bảng xếp hạng Top Tour bán chạy
  const topToursColumns = [
    {
      title: "Hạng",
      key: "rank",
      align: "center",
      width: 80,
      render: (_, __, index) => {
        const rank = index + 1;
        let badgeColor = "#8c8c8c";
        if (rank === 1) badgeColor = "#fadb14"; // Vàng
        else if (rank === 2) badgeColor = "#d9d9d9"; // Bạc
        else if (rank === 3) badgeColor = "#d4380d"; // Đồng
        
        return (
          <span 
            style={{ 
              display: "inline-block", 
              width: 28, 
              height: 28, 
              borderRadius: "50%", 
              background: badgeColor, 
              color: rank <= 3 ? "#fff" : "#333", 
              textAlign: "center", 
              lineHeight: "28px", 
              fontWeight: "bold",
              boxShadow: rank <= 3 ? "0 2px 4px rgba(0,0,0,0.15)" : "none"
            }}
          >
            {rank}
          </span>
        );
      }
    },
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      width: 100,
      align: "center",
      render: (img) => (
        <img 
          src={img || "https://placehold.co/80x50?text=Tour"} 
          alt="tour" 
          style={{ width: 70, height: 45, objectFit: "cover", borderRadius: 6, border: "1px solid #f0f0f0" }} 
        />
      )
    },
    {
      title: "Mã tour",
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (code) => <b style={{ color: "#00b96b" }}>{code}</b>
    },
    {
      title: "Tên Tour",
      dataIndex: "title",
      key: "title",
      render: (title) => <span style={{ fontWeight: 500 }}>{title}</span>
    },
    {
      title: "Giá gốc",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (price) => `${Number(price || 0).toLocaleString()}đ`
    },
    {
      title: "Lượt đặt (slots)",
      dataIndex: "totalBookings",
      key: "totalBookings",
      width: 150,
      align: "center",
      render: (bookings) => <Tag color="orange" style={{ fontWeight: "bold", fontSize: 13 }}>{bookings} chỗ</Tag>
    },
    {
      title: "Doanh thu hoàn thành",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 200,
      render: (rev) => (
        <span style={{ color: "#f5222d", fontWeight: "bold" }}>
          {Number(rev || 0).toLocaleString()}đ
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Tổng quan hệ thống</Title>

      {/* ====== HÀNG 1: 4 THẺ TỔNG QUAN TÍCH LŨY ====== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Tổng doanh thu"
              value={statistic.order?.revenue || 0}
              suffix="đ"
              prefix={<DollarOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Tổng đơn hàng"
              value={statistic.order?.total || 0}
              prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              Đã hoàn thành: {statistic.order?.completed || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Tổng số Tour"
              value={statistic.tour?.total || 0}
              prefix={<GlobalOutlined style={{ color: "#52c41a" }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              Đang hoạt động: {statistic.tour?.active || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} loading={loading} style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Tổng tài khoản"
              value={statistic.account?.total || 0}
              prefix={<TeamOutlined style={{ color: "#722ed1" }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              Đang hoạt động: {statistic.account?.active || 0}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      {/* ====== HÀNG 2: THỐNG KÊ DOANH THU THEO KỲ ====== */}
      <Title level={4} style={{ marginBottom: 16 }}>Doanh thu & Số đơn hoàn thành theo kỳ</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {/* Hôm nay */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            loading={loading} 
            style={{ 
              borderRadius: 12, 
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.08)", 
              borderLeft: "5px solid #1890ff",
              background: "#fafcff" 
            }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: "#1890ff" }}>Doanh thu hôm nay</span>}
              value={revenueStats?.today || 0}
              suffix="đ"
              valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
              prefix={<CalendarOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
              Đơn hoàn thành: <b>{revenueStats?.todayCount || 0}</b> đơn
            </div>
          </Card>
        </Col>
        
        {/* Tuần này */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            loading={loading} 
            style={{ 
              borderRadius: 12, 
              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.08)", 
              borderLeft: "5px solid #52c41a",
              background: "#fcfdfa" 
            }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: "#52c41a" }}>Doanh thu tuần này</span>}
              value={revenueStats?.week || 0}
              suffix="đ"
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
              prefix={<RiseOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
              Đơn hoàn thành: <b>{revenueStats?.weekCount || 0}</b> đơn
            </div>
          </Card>
        </Col>

        {/* Tháng này */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            loading={loading} 
            style={{ 
              borderRadius: 12, 
              boxShadow: "0 4px 12px rgba(250, 140, 22, 0.08)", 
              borderLeft: "5px solid #fa8c16",
              background: "#fffbfa" 
            }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: "#fa8c16" }}>Doanh thu tháng này</span>}
              value={revenueStats?.month || 0}
              suffix="đ"
              valueStyle={{ color: "#fa8c16", fontWeight: "bold" }}
              prefix={<DollarOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
              Đơn hoàn thành: <b>{revenueStats?.monthCount || 0}</b> đơn
            </div>
          </Card>
        </Col>

        {/* Năm nay */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            loading={loading} 
            style={{ 
              borderRadius: 12, 
              boxShadow: "0 4px 12px rgba(114, 46, 209, 0.08)", 
              borderLeft: "5px solid #722ed1",
              background: "#faf9fc" 
            }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: "#722ed1" }}>Doanh thu năm nay</span>}
              value={revenueStats?.year || 0}
              suffix="đ"
              valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
              prefix={<GlobalOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
              Đơn hoàn thành: <b>{revenueStats?.yearCount || 0}</b> đơn
            </div>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      {/* ====== HÀNG MỚI: BIỂU ĐỒ DOANH THU & PHÂN BỔ TRẠNG THÁI ====== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>Xu hướng doanh thu 12 tháng gần nhất</span>}
            bordered={false} 
            loading={loading}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", height: 380 }}
          >
            <div style={{ height: 280, width: "100%" }}>
              {monthlyRevenue && monthlyRevenue.length > 0 ? (
                <Line data={revenueChartData} options={revenueChartOptions} />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                  Không có dữ liệu doanh thu
                </div>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>Phân bổ trạng thái đơn hàng</span>}
            bordered={false} 
            loading={loading}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", height: 380 }}
          >
            <div style={{ height: 280, width: "100%" }}>
              {statusDistribution && statusDistribution.some(item => item.count > 0) ? (
                <Doughnut data={statusChartData} options={statusChartOptions} />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                  Không có dữ liệu trạng thái đơn hàng
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "24px 0" }} />

      {/* ====== HÀNG MỚI: TOP TOUR BÁN CHẠY ====== */}
      <Card 
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>Top 5 Tour bán chạy nhất & Doanh thu tương ứng</span>}
        bordered={false} 
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 32 }}
      >
        <Table
          columns={topToursColumns}
          dataSource={topTours || []}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>

      <Divider style={{ margin: "24px 0" }} />

      {/* ====== HÀNG 3: BỘ LỌC VÀ DANH SÁCH ĐƠN HÀNG INTERACTIVE ====== */}
      <Card 
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>Quản lý & Tìm kiếm Đơn đặt hàng</span>}
        bordered={false} 
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        {/* Bộ lọc */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Nhập mã đơn, tên, số điện thoại..."
              prefix={<SearchOutlined />}
              allowClear
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Select
              placeholder="Lọc trạng thái"
              allowClear
              style={{ width: "100%" }}
              value={filters.status || undefined}
              onChange={(val) => setFilters(prev => ({ ...prev, status: val || "" }))}
              suffixIcon={<FilterOutlined />}
            >
              <Select.Option value="initial">Khởi tạo</Select.Option>
              <Select.Option value="paid">Đã thanh toán</Select.Option>
              <Select.Option value="completed">Hoàn thành</Select.Option>
              <Select.Option value="cancelled">Đã hủy</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ width: "100%" }}>
              Đặt lại
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng ${total} đơn hàng` }}
          loading={loading}
        />
      </Card>
    </div>
  );
}

export default AdminDashboard;
