import { Layout, Menu, Typography } from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  SettingOutlined,
  GlobalOutlined,
  TagsOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined,
  ShoppingCartOutlined,
  DashboardOutlined,
  MessageOutlined,
  ReadOutlined,
  FileTextOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import logoImg from "../../../assets/logo.png";
import "./AdminSider.css";

import React, { useEffect, useState } from "react";
import { adminMe } from "../../../services/api";

const { Sider } = Layout;
const { Text } = Typography;

function AdminSider({ collapsed, onCollapse }) {
  const location = useLocation();
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => {
    const cachedTitle = localStorage.getItem("admin_role_title");
    const cachedPermsRaw = localStorage.getItem("admin_role_permissions");
    let cachedPerms = [];
    try {
      if (cachedPermsRaw) cachedPerms = JSON.parse(cachedPermsRaw);
    } catch {}
    
    return (
      cachedTitle === "Quản Trị Viên" ||
      cachedTitle === "Admin" ||
      cachedTitle === "Super Admin" ||
      cachedPerms.includes("roles_permissions")
    );
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await adminMe();
        if (res.data && res.data.role) {
          const role = res.data.role;
          localStorage.setItem("admin_role_title", role.title || "");
          localStorage.setItem("admin_role_permissions", JSON.stringify(role.permissions || []));
          
          const isAdmin = 
            role.title === "Quản Trị Viên" || 
            role.title === "Admin" || 
            role.title === "Super Admin" || 
            (role.permissions && role.permissions.includes("roles_permissions"));
            
          setIsSuperAdmin(isAdmin);
        }
      } catch (err) {
        console.error("Failed to fetch admin role:", err);
      }
    };
    fetchUserRole();
  }, []);

  const getSelectedKey = () => {
    if (location.pathname.startsWith("/admin/dashboard")) return "dashboard";
    if (location.pathname.startsWith("/admin/tours/create")) return "tours-create";
    if (location.pathname.startsWith("/admin/tours")) return "tours";
    if (location.pathname.startsWith("/admin/orders")) return "orders";
    if (location.pathname.startsWith("/admin/categories")) return "categories";
    if (location.pathname.startsWith("/admin/roles/permissions")) return "roles-permissions";
    if (location.pathname.startsWith("/admin/roles")) return "roles";
    if (location.pathname.startsWith("/admin/accounts")) return "accounts";
    if (location.pathname.startsWith("/admin/chat")) return "chat";
    if (location.pathname.startsWith("/admin/articles/create")) return "articles-create";
    if (location.pathname.startsWith("/admin/articles")) return "articles";
    return "tours";
  };

  const allMenuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Tổng quan</Link>,
    },
    {
      key: "tour-group",
      icon: <GlobalOutlined />,
      label: "Quản lý Tour",
      children: [
        {
          key: "tours",
          icon: <UnorderedListOutlined />,
          label: <Link to="/admin/tours">Danh sách tour</Link>,
        },
        {
          key: "tours-create",
          icon: <AppstoreOutlined />,
          label: <Link to="/admin/tours/create">Thêm tour mới</Link>,
        },
      ],
    },
    {
      key: "orders-group",
      icon: <ShoppingCartOutlined />,
      label: "Đơn hàng",
      children: [
        {
          key: "orders",
          icon: <UnorderedListOutlined />,
          label: <Link to="/admin/orders">Danh sách đơn hàng</Link>,
        },
      ],
    },
    {
      key: "category-group",
      icon: <TagsOutlined />,
      label: "Danh mục",
      children: [
        {
          key: "categories",
          icon: <TagsOutlined />,
          label: <Link to="/admin/categories">Danh sách danh mục</Link>,
        },
      ],
    },
    {
      key: "chat",
      icon: <MessageOutlined />,
      label: <Link to="/admin/chat">Chat Hỗ trợ</Link>,
    },
    {
      key: "article-group",
      icon: <ReadOutlined />,
      label: "Bài viết",
      children: [
        {
          key: "articles",
          icon: <FileTextOutlined />,
          label: <Link to="/admin/articles">Danh sách bài viết</Link>,
        },
        {
          key: "articles-create",
          icon: <PlusOutlined />,
          label: <Link to="/admin/articles/create">Thêm bài viết</Link>,
        },
      ],
    },
    {
      type: "divider",
    },
    {
      key: "system-group",
      icon: <SettingOutlined />,
      label: "Hệ thống",
      children: [
        {
          key: "accounts",
          icon: <TeamOutlined />,
          label: <Link to="/admin/accounts">Tài khoản</Link>,
        },
        {
          key: "roles",
          icon: <UserSwitchOutlined />,
          label: <Link to="/admin/roles">Vai trò</Link>,
        },
        {
          key: "roles-permissions",
          icon: <SafetyCertificateOutlined />,
          label: <Link to="/admin/roles/permissions">Phân quyền</Link>,
        },
      ],
    },
  ];

  // Lọc các chức năng của nhân viên (chỉ Super Admin mới thấy Dashboard và Hệ thống)
  const menuItems = allMenuItems.filter(item => {
    if (!isSuperAdmin) {
      if (item.key === "dashboard") return false;
      if (item.key === "system-group") return false;
      if (item.type === "divider") return false;
    }
    return true;
  });

  return (
    <Sider
      width={240}
      breakpoint="lg"
      collapsedWidth="0"
      trigger={null}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className="admin-sider"
      theme="dark"
    >
      {/* Logo area */}
      <div className="sider-logo">
        <img src={logoImg} className="sider-logo-img" alt="TourVN Logo" />
        <Text strong className="sider-logo-text">TourVN Admin</Text>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={["tour-group", "orders-group", "category-group", "article-group", "system-group"]}
        items={menuItems}
        className="admin-menu"
      />
    </Sider>
  );
}

export default AdminSider;
