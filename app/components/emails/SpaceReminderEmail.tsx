import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
} from '@react-email/components';

interface SpaceReminderEmailProps {
  title: string;
  scheduledfor: string;
  guestspeaker?: string;
  description: string;
  spaceId: string;
}

export default function SpaceReminderEmail({
  title,
  scheduledfor,
  guestspeaker,
  description,
  spaceId,
}: SpaceReminderEmailProps) {
  const spaceUrl = `https://twitter.com/i/spaces/${spaceId}`;
  const date = new Date(scheduledfor).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <Html>
      <Head />
      <Preview>Your Twitter Space starts in 30 minutes!</Preview>
      <Body style={{ fontFamily: 'system-ui' }}>
        <Container>
          <Text>Your Twitter Space is starting soon!</Text>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{title}</Text>
          <Text>🕒 Starting at: {date}</Text>
          {guestspeaker && <Text>👤 Guest Speaker: {guestspeaker}</Text>}
          <Text>📝 {description}</Text>
          <Link
            href={spaceUrl}
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              backgroundColor: '#1DA1F2',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              marginTop: '16px',
            }}
          >
            Join Space
          </Link>
        </Container>
      </Body>
    </Html>
  );
} 