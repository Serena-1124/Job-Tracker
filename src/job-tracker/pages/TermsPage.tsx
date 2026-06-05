import { Typography, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <Card>
        <Title level={3}>服务条款</Title>
        <Paragraph>
          欢迎使用 JobTracker（以下简称"本服务"）。使用本服务即表示您同意以下条款：
        </Paragraph>

        <Title level={5}>1. 服务说明</Title>
        <Paragraph>
          本服务提供求职进度管理功能，包括投递记录管理、待办事项、面经记录、数据分析等。所有功能仅供个人求职管理使用。
        </Paragraph>

        <Title level={5}>2. 账号注册</Title>
        <Paragraph>
          您需要提供有效的邮箱地址进行注册。首次登录时，如果邮箱未注册，系统将自动为您创建账号。您有责任妥善保管账号和密码。
        </Paragraph>

        <Title level={5}>3. 数据存储</Title>
        <Paragraph>
          您的数据采用「本地浏览器 + Supabase 云端」双存储机制。离线时数据保存在本地，联网后自动同步到云端。我们采用行业标准的安全措施保护您的数据。
        </Paragraph>

        <Title level={5}>4. 用户责任</Title>
        <Paragraph>
          您承诺不使用本服务进行任何违法活动，不上传恶意文件，不攻击或干扰服务正常运行。您对自己的账号下的所有行为负责。
        </Paragraph>

        <Title level={5}>5. 服务变更</Title>
        <Paragraph>
          我们保留随时修改或终止服务的权利，无需事先通知。重大变更将通过网站公告或邮件通知用户。
        </Paragraph>

        <Title level={5}>6. 免责声明</Title>
        <Paragraph>
          本服务按"现状"提供，不对服务的连续性、安全性、准确性做出任何明示或暗示的保证。因网络故障、设备问题等导致的数据丢失，我们不承担责任，但会尽力协助恢复。
        </Paragraph>

        <Title level={5}>7. 终止服务</Title>
        <Paragraph>
          您可随时停止使用本服务。我们保留在发现违规使用时终止您账号的权利。
        </Paragraph>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a onClick={() => navigate(-1)} style={{ color: '#B5A99A' }}>返回</a>
        </div>
      </Card>
    </div>
  );
}
