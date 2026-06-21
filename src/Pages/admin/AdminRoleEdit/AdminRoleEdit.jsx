import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Select, message, Typography, Space, Spin } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminRoleById, updateAdminRole } from "../../../services/api";

const { Title } = Typography;
const { TextArea } = Input;

function AdminRoleEdit() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await getAdminRoleById(id);
        if (res.data.role) {
          form.setFieldsValue(res.data.role);
        } else {
          message.error("Không tìm thấy vai trò");
          navigate("/admin/roles");
        }
      } catch (error) {
        message.error("Lỗi lấy thông tin vai trò");
        navigate("/admin/roles");
      } finally {
        setFetching(false);
      }
    };
    fetchRole();
  }, [id, form, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await updateAdminRole(id, values);
      if (res.data.code === "success") {
        message.success("Cập nhật vai trò thành công!");
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

  if (fetching) {
    return <div style={{ textAlign: "center", padding: 50 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/roles")}>
          Quay lại
        </Button>
        <Title level={3} style={{ margin: 0 }}>Cập nhật vai trò</Title>
      </Space>

      <Card style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Tên vai trò"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tên vai trò!" }]}
          >
            <Input placeholder="Ví dụ: Quản lý, Kế toán..." size="large" />
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
              Cập nhật vai trò
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AdminRoleEdit;
