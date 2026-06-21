import { useState } from "react";
import { Form, Input, Button, Card, Select, message, Typography, Space } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { createAdminRole } from "../../../services/api";

const { Title } = Typography;
const { TextArea } = Input;

function AdminRoleCreate() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await createAdminRole(values);
      if (res.data.code === "success") {
        message.success("Tạo vai trò thành công!");
        navigate("/admin/roles");
      } else {
        message.error(res.data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/roles")}>
          Quay lại
        </Button>
        <Title level={3} style={{ margin: 0 }}>Thêm mới vai trò</Title>
      </Space>

      <Card style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: "active" }}
        >
          <Form.Item
            label="Tên vai trò"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tên vai trò!" }]}
          >
            <Input placeholder="Ví dụ: Quản lý, Kế toán, Nhân viên..." size="large" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={4} placeholder="Nhập mô tả chi tiết về vai trò này..." />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status">
            <Select size="large">
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Tắt</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              Tạo vai trò
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AdminRoleCreate;
