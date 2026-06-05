import { Typography, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <Card>
        <Title level={3}>隐私说明</Title>
        <Paragraph>
          JobTracker 是一款本地优先的求职管理工具。本说明帮助您了解您的数据如何被处理和存储。
        </Paragraph>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>1. 数据归属</Title>
          <Paragraph style={{ marginBottom: 0 }}>
            您在 JobTracker 中填写的所有求职数据（投递记录、待办事项、面经记录等）均属于您个人。这些数据由您主动创建，开发者无法查看、访问或使用您的任何数据。
          </Paragraph>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>2. 数据存储位置</Title>
          <Paragraph style={{ marginBottom: 8 }}>
            您的数据存储在以下位置：
          </Paragraph>
          <ul style={{ color: '#5D5348', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>本地存储：保存在您当前浏览器的 IndexedDB 中，完全离线可用</li>
            <li>云端同步：如您选择登录账号，数据将同步到您的 Supabase 云端数据库，用于跨设备访问</li>
          </ul>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>3. 账号信息</Title>
          <Paragraph style={{ marginBottom: 0 }}>
            登录功能使用 Supabase 认证服务。您的邮箱和密码由 Supabase 安全处理并加密存储，开发者不保存您的密码，也无法访问您的账号信息。
          </Paragraph>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>4. 我们不收集的信息</Title>
          <Paragraph style={{ marginBottom: 8 }}>
            我们不会收集以下内容：
          </Paragraph>
          <ul style={{ color: '#5D5348', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>您的浏览记录或访问行为数据</li>
            <li>您的设备信息或浏览器类型</li>
            <li>任何第三方平台的个人数据</li>
            <li>用于广告或商业分析的数据</li>
          </ul>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>5. 数据安全</Title>
          <Paragraph style={{ marginBottom: 8 }}>
            我们采用以下措施保护您的数据：
          </Paragraph>
          <ul style={{ color: '#5D5348', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>所有网络通信均通过 HTTPS 加密传输</li>
            <li>云端数据库启用行级安全策略（RLS），确保不同用户数据完全隔离</li>
            <li>密码采用 bcrypt 加密存储</li>
            <li>本地数据存储在您的浏览器中，其他网站无法访问</li>
          </ul>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>6. 您的权利</Title>
          <Paragraph style={{ marginBottom: 8 }}>
            您对自己的数据拥有完全控制权：
          </Paragraph>
          <ul style={{ color: '#5D5348', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>随时查看、修改或删除您在工具中填写的任何数据</li>
            <li>导出您的所有数据为文件备份</li>
            <li>如需彻底删除所有数据，请在网站内删除全部记录，本地与云端将同步清除，不会留下任何痕迹</li>
          </ul>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>7. 本地存储说明</Title>
          <Paragraph style={{ marginBottom: 0 }}>
            我们使用浏览器的 localStorage 仅用于保存您的登录状态，使用 IndexedDB 存储您的求职数据。这些技术仅用于让工具正常运行，不用于追踪或分析您的行为。
          </Paragraph>
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ marginBottom: 8 }}>8. 说明更新</Title>
          <Paragraph style={{ marginBottom: 0 }}>
            我们可能不时更新本隐私说明。如有重大变更，将通过网站公告或邮件通知用户。继续使用本工具即表示您接受更新后的说明。
          </Paragraph>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a onClick={() => navigate(-1)} style={{ color: '#B5A99A' }}>返回</a>
        </div>
      </Card>
    </div>
  );
}
