import { Typography } from "antd";
import "./BoxHead.css";

const { Title } = Typography;

function BoxHead({ title, subtitle }) {
  return (
    <div className="box-head">
      <Title level={2} className="box-head-title">{title}</Title>
      {subtitle && (
        <p className="box-head-subtitle">{subtitle}</p>
      )}
      <div className="box-head-divider" />
    </div>
  );
}

export default BoxHead;
