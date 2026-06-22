import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Table, Select, Tag, Typography, message, Card,
  Button, Space, Tooltip, Popconfirm, Input, DatePicker, Row, Col,
  Tabs, Statistic
} from "antd";
import { EyeOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, ReloadOutlined, ExportOutlined } from "@ant-design/icons";
import { getAdminOrders, updateAdminOrderStatus, deleteAdminOrder } from "../../../services/api";
import dayjs from "dayjs";
import { getToken } from "../../../utils/auth";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const STATUS_CONFIG = {
  initial:   { color: "blue",   label: "Khởi tạo" },
  paid:      { color: "green",  label: "Đã thanh toán" },
  completed: { color: "purple", label: "Hoàn thành" },
  cancelled: { color: "red",    label: "Đã hủy" },
};

function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    dateRange: null,
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders();
      setOrders(res.data.orders || []);
    } catch {
      message.error("Lỗi khi lấy danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      message.success("Cập nhật trạng thái thành công");
      fetchOrders();
    } catch {
      message.error("Cập nhật thất bại");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteAdminOrder(id);
      if (res.data.code === "success") {
        message.success("Xóa đơn hàng thành công!");
        fetchOrders();
      } else {
        message.error(res.data.message || "Xóa thất bại");
      }
    } catch {
      message.error("Lỗi kết nối máy chủ!");
    }
  };

  const handleReset = () => {
    setFilters({
      keyword: "",
      status: "",
      dateRange: null,
    });
  };

  const filteredOrders = orders.filter((order) => {
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
    if (filters.dateRange && filters.dateRange.length === 2) {
      const start = filters.dateRange[0].startOf("day");
      const end = filters.dateRange[1].endOf("day");
      const createdAt = dayjs(order.createdAt);
      if (createdAt.isBefore(start) || createdAt.isAfter(end)) {
        return false;
      }
    }
    return true;
  });

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      message.warning("Không có đơn hàng nào để xuất báo cáo!");
      return;
    }

    const token = getToken();
    const { keyword, status, dateRange } = filters;

    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    let url = `${apiBase}/api/admin/orders/export?token=${token}`;

    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    if (dateRange && dateRange.length === 2) {
      url += `&startDate=${dateRange[0].format("YYYY-MM-DD")}`;
      url += `&endDate=${dateRange[1].format("YYYY-MM-DD")}`;
    }

    // Trigger browser file download directly
    window.location.href = url;
    message.success("Đang tải xuống báo cáo Excel...");
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      key: "code",
      render: (code) => <b style={{ color: "#00b96b" }}>{code}</b>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => (
        <div>
          <div><b>{record.fullName}</b></div>
          <div style={{ fontSize: 12, color: "#888" }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: "Số Tour",
      dataIndex: "totalTours",
      key: "totalTours",
      width: 90,
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
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => {
        if (method === "bank_transfer") {
          return <Tag color="cyan">Chuyển khoản VietQR</Tag>;
        }
        return <Tag color="gold">Tiền mặt</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 155 }}
          onChange={(val) => handleStatusChange(record.id, val)}
          options={Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
            value,
            label: <Tag color={cfg.color}>{cfg.label}</Tag>,
          }))}
        />
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chi tiết đơn hàng">
            <Link to={`/admin/orders/${record.id}`}>
              <Button type="default" icon={<EyeOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Xóa đơn hàng">
            <Popconfirm
              title="Bạn có chắc muốn xóa đơn hàng này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Thống kê doanh thu & đơn hàng
  const totalCount = filteredOrders.length;
  const unpaidCount = filteredOrders.filter(o => o.status === "initial" || o.status === "Khởi tạo").length;
  const paidCount = filteredOrders.filter(o => o.status === "paid" || o.status === "Đã thanh toán").length;
  const completedCount = filteredOrders.filter(o => o.status === "completed" || o.status === "Hoàn thành").length;
  const cancelledCount = filteredOrders.filter(o => o.status === "cancelled" || o.status === "Đã hủy").length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);

  const handleTabChange = (key) => {
    setFilters(prev => ({ ...prev, status: key === "all" ? "" : key }));
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 20 }}>Quản lý Đơn đặt Tour</Title>

      {/* ====== Bộ tìm kiếm / lọc nâng cao ====== */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Mã đơn, tên, số điện thoại..."
                  prefix={<SearchOutlined />}
                  allowClear
                  value={filters.keyword}
                  onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Select
                  placeholder="Chọn trạng thái"
                  allowClear
                  style={{ width: "100%" }}
                  value={filters.status || undefined}
                  onChange={(val) => setFilters(prev => ({ ...prev, status: val || "" }))}
                  suffixIcon={<FilterOutlined />}
                >
                  {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                    <Select.Option key={value} value={value}>
                      {cfg.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={10}>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["Từ ngày", "Đến ngày"]}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: "right" }}>
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                style={{ backgroundColor: "#00b96b", borderColor: "#00b96b" }}
                onClick={handleExportExcel}
              >
                Xuất báo cáo
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ====== Tabs trạng thái đơn hàng (Quick Filters) ====== */}
      <Tabs
        activeKey={filters.status || "all"}
        onChange={handleTabChange}
        style={{ marginBottom: 16 }}
        items={[
          { key: "all", label: `Tất cả (${orders.length})` },
          { key: "initial", label: `Chờ thanh toán (${orders.filter(o => o.status === "initial" || o.status === "Khởi tạo").length})` },
          { key: "paid", label: `Đã thanh toán (${orders.filter(o => o.status === "paid" || o.status === "Đã thanh toán").length})` },
          { key: "completed", label: `Hoàn thành (${orders.filter(o => o.status === "completed" || o.status === "Hoàn thành").length})` },
          { key: "cancelled", label: `Đã hủy (${orders.filter(o => o.status === "cancelled" || o.status === "Đã hủy").length})` },
        ]}
      />

      <Card style={{ borderRadius: 8 }}>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} đơn hàng` }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: "#f6ffed", fontWeight: "bold" }}>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <div style={{ textAlign: "right", paddingRight: 16 }}>Tổng doanh thu lọc được:</div>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{ color: "#f5222d", fontSize: 16 }}>
                    {totalRevenue.toLocaleString()}đ
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={4} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
}

export default AdminOrders;
