import { useState, useEffect } from "react";
import { Form, Input, Button, message, Typography, Card, Alert, Upload, Space, Row, Col, Spin, Avatar } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, SaveOutlined, UploadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { clientUpdateProfile } from "../../../services/api";
import { isLoggedIn, getUser, saveUser } from "../../../utils/auth";

const { Title, Text } = Typography;

function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const navigate = useNavigate();
  const currentUser = getUser();

  // Redirect if not logged in
  if (!isLoggedIn()) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <Alert
          message="Bạn chưa đăng nhập"
          description={<>Vui lòng <Link to="/login">đăng nhập</Link> để chỉnh sửa thông tin cá nhân.</>}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // Pre-fill form values
  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || "",
      });
      setPreviewUrl(currentUser.avatar || "");
    }
  }, [form]);

  // Upload configuration
  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      setPreviewUrl(currentUser?.avatar || "");
    },
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
      if (!isJpgOrPng) {
        message.error("Bạn chỉ có thể tải lên tệp ảnh (JPG/PNG/WebP)!");
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 5;
      if (!isLt2M) {
        message.error("Kích thước ảnh tối đa là 5MB!");
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      // Create local preview URL
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
      return false; // Prevent automatic upload
    },
    fileList,
    maxCount: 1,
    showUploadList: false,
    accept: "image/*",
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("fullName", values.fullName);
    formData.append("phone", values.phone || "");
    formData.append("email", values.email);

    if (fileList[0]) {
      formData.append("avatar", fileList[0]);
    }

    try {
      const res = await clientUpdateProfile(formData);
      if (res.data.code === "success") {
        // Save new user details in local storage
        saveUser(res.data.user);
        
        // Notify other components (Header, Chat, etc.) to reload the user context
        window.dispatchEvent(new Event("userUpdated"));
        
        message.success("Cập nhật thông tin cá nhân thành công!");
        setFileList([]);
      } else {
        message.error(res.data.message || "Cập nhật thất bại!");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "48px auto", padding: "0 16px" }}>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
          Trang chủ
        </Button>
        <Title level={3} style={{ margin: 0 }}>Thông Tin Cá Nhân</Title>
      </Space>

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Row gutter={[32, 24]}>
            {/* Left Column: Avatar Upload & Preview */}
            <Col xs={24} md={8} style={{ textAlign: "center", borderRight: "1px solid #f0f0f0" }}>
              <div style={{ marginBottom: 16, position: "relative", display: "inline-block" }}>
                <Avatar
                  size={120}
                  src={previewUrl}
                  icon={<UserOutlined />}
                  style={{ border: "4px solid #e6f7ff", backgroundColor: "#00b96b" }}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />} type="dashed">
                    Chọn ảnh đại diện
                  </Button>
                </Upload>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hỗ trợ JPG, PNG, WebP (tối đa 5MB)
                </Text>
              </div>
            </Col>

            {/* Right Column: User Profile Details Form */}
            <Col xs={24} md={16}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#bbb" }} />}
                  placeholder="Nhập họ và tên"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" }
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: "#bbb" }} />}
                  placeholder="Nhập địa chỉ email"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { pattern: /^[0-9+]+$/, message: "Số điện thoại chỉ gồm chữ số" }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: "#bbb" }} />}
                  placeholder="Nhập số điện thoại"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  block
                  style={{
                    height: 46,
                    borderRadius: 10,
                    fontWeight: 600,
                    backgroundColor: "#00b96b",
                    borderColor: "#00b96b"
                  }}
                >
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

export default Profile;
