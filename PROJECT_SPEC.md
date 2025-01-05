# Gossip With Brother Elkana - Project Specification

## Overview
A Twitter Space initiative focused on fostering meaningful conversations through weekly sessions, conducted primarily in English with Swahili support. The platform emphasizes simplicity, accessibility, and community engagement through a reward-based system.

## Core Features
### Twitter Spaces Integration
- Weekly live sessions (no recordings at the moment but we will add them later)
-English language
- Guest speaker integration
- Live-only format to encourage real-time participation

### Web Application
#### Phase 1 (MVP)
- Simple, focused interface
- Authentication via Clerk (Twitter)
- Basic reward tracking system
- Minimal viable features to start
- homepage does not need authentication
- homepage shows any ongoing (live) twitter spaces with a redirect link to join the space on twitter (we will need to integrate the twitter api to get the spaces)
-admin can schedule a space and add a guest speaker and users can get email notifications 30 minutes before the space starts
-once logged in, users can view live space and their participants.

### Reward System
- Types of Rewards:
  - Airtime
  - Transport vouchers
  - Bill payments
- Universal eligibility for all users
- Transparent tracking through web app

## Partnership Framework
- Open partnership model (non-exclusive)
- Flexible commitment terms for initial phase
- Focus on essential services (transport, telecommunications, utilities)

## Community Management
### Volunteer Roles
- Content moderation
- Digital marketing
- Community outreach
- Cause-based donations

### Volunteer Benefits
- Recognition-based incentive system
- Off-platform training and management

## Technical Implementation
### Phase 1: Foundation
- Next.js web application
- Clerk authentication (done)
- Twitter API integration
- Basic reward tracking

### Technical Constraints
- API usage optimization (free tier limitations)
- Cost-effective scaling strategy
- AI-assisted development

## Risk Management
### Key Challenges
- API limits management
- Budget constraints
- Content moderation

### Moderation Strategy
- Dedicated moderation team
- Neutral stance on sensitive topics
- Clear community guidelines

## Success Metrics
- Active participation in spaces
- Contribution levels
- Community growth
- Partnership engagement

## Next Steps
1. Implement basic web application
2. Set up authentication system (done)
3. Integrate Twitter Spaces
4. Establish initial partnerships
5. Launch MVP with core features