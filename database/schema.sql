-- iFlow Database Schema for PostgreSQL
-- Comprehensive schema supporting all features from PRD v2.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE USER & IDENTITY TABLES
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

CREATE TABLE user_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'etsy', 'patreon', 'instagram', 'custom'
    url VARCHAR(500) NOT NULL,
    display_text VARCHAR(100),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL, -- 'instructor', 'organizer', 'performer', 'safety_lead'
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, badge_type)
);

-- ============================================================================
-- HUB & LOCATION MANAGEMENT
-- ============================================================================

CREATE TABLE hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    avatar_url VARCHAR(500)
);

CREATE TABLE hub_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'organizer', 'safety_lead', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(hub_id, user_id)
);

-- ============================================================================
-- PROP TAGS & TAXONOMY
-- ============================================================================

CREATE TABLE prop_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'poi', 'staff', 'hoop', 'rope', 'fan', 'other'
    description TEXT,
    icon_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EVENT MANAGEMENT & SCHEDULING
-- ============================================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_fire_event BOOLEAN DEFAULT false,
    requires_safety_lead BOOLEAN DEFAULT false,
    max_attendees INTEGER,
    flow_rating DECIMAL(3, 2) DEFAULT 0.00, -- Quality/safety score
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'cancelled', 'completed'
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_instructors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'instructor', -- 'instructor', 'safety_lead', 'assistant'
    UNIQUE(event_id, user_id, role)
);

CREATE TABLE event_prop_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    prop_tag_id UUID REFERENCES prop_tags(id) ON DELETE CASCADE,
    UNIQUE(event_id, prop_tag_id)
);

CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'going', 'interested', 'not_going'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE TABLE event_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL, -- 'time_overlap', 'instructor_double_booking', 'missing_safety'
    conflict_with_event_id UUID REFERENCES events(id),
    conflict_with_user_id UUID REFERENCES users(id),
    description TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIDEO SYSTEM ("THE LOOP")
-- ============================================================================

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hub_id UUID REFERENCES hubs(id),
    title VARCHAR(255),
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER, -- in seconds
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    premium_price DECIMAL(10, 2),
    tier_level INTEGER, -- 1, 2, 3 for tiered access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE video_prop_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    prop_tag_id UUID REFERENCES prop_tags(id) ON DELETE CASCADE,
    UNIQUE(video_id, prop_tag_id)
);

CREATE TABLE video_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
);

CREATE TABLE video_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    watch_duration INTEGER -- seconds watched
);

CREATE TABLE video_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp INTEGER NOT NULL, -- milliseconds into video
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRAINING PLANS & COLLECTIONS
-- ============================================================================

CREATE TABLE training_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_plan_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(training_plan_id, video_id)
);

-- ============================================================================
-- COMMUNITY FEED & POSTS
-- ============================================================================

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hub_id UUID REFERENCES hubs(id),
    content TEXT NOT NULL CHECK (LENGTH(content) <= 280),
    is_public BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    pinned_at TIMESTAMP,
    pinned_by UUID REFERENCES users(id),
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) DEFAULT '❤️',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, emoji)
);

-- ============================================================================
-- FLOW STORIES (24h ephemeral content)
-- ============================================================================

CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) NOT NULL, -- 'image', 'video'
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE story_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- ============================================================================
-- DISCUSSION THREADS & COMMENTS
-- ============================================================================

-- Specific comment tables for each entity type
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE event_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE video_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- Universal comment likes table
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL, -- Can reference any comment table
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- DIRECT MESSAGING
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_group BOOLEAN DEFAULT false,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MARKETPLACE
-- ============================================================================

CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hub_id UUID REFERENCES hubs(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    condition VARCHAR(50), -- 'new', 'like_new', 'good', 'fair', 'for_parts'
    listing_type VARCHAR(50) DEFAULT 'sale', -- 'sale', 'trade', 'free'
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_urls TEXT[], -- array of image URLs
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'sold', 'expired', 'deleted'
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace_prop_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    prop_tag_id UUID REFERENCES prop_tags(id) ON DELETE CASCADE,
    UNIQUE(listing_id, prop_tag_id)
);

CREATE TABLE listing_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- ============================================================================
-- MONETIZATION & CREATOR ECONOMICS
-- ============================================================================

CREATE TABLE creator_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier_level INTEGER NOT NULL CHECK (tier_level IN (1, 2, 3)),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    benefits TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(creator_id, tier_level)
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES creator_tiers(id),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    UNIQUE(subscriber_id, creator_id)
);

CREATE TABLE video_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
);

CREATE TABLE tip_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'paypal', 'venmo', 'cashapp', 'stripe'
    url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hub_fundraisers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID REFERENCES hubs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'event_invite', 'new_comment', 'new_like', 'new_follower', etc.
    entity_type VARCHAR(50),
    entity_id UUID,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Hub indexes
CREATE INDEX idx_hubs_location ON hubs(latitude, longitude);
CREATE INDEX idx_hub_members_hub_id ON hub_members(hub_id);
CREATE INDEX idx_hub_members_user_id ON hub_members(user_id);

-- Event indexes
CREATE INDEX idx_events_hub_id ON events(hub_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);

-- Video indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_hub_id ON videos(hub_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_is_premium ON videos(is_premium);

-- Post indexes
CREATE INDEX idx_posts_hub_id ON posts(hub_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_pinned ON posts(is_pinned);

-- Marketplace indexes
CREATE INDEX idx_marketplace_listings_hub_id ON marketplace_listings(hub_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_location ON marketplace_listings(latitude, longitude);

-- Message indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hubs_updated_at BEFORE UPDATE ON hubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update counters
CREATE OR REPLACE FUNCTION update_video_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE videos SET like_count = like_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE videos SET like_count = like_count - 1 WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_likes_count AFTER INSERT OR DELETE ON video_likes
    FOR EACH ROW EXECUTE FUNCTION update_video_like_count();

-- ============================================================================
-- SEED DATA (Sample Prop Tags)
-- ============================================================================

INSERT INTO prop_tags (name, category) VALUES
    ('Poi', 'poi'),
    ('Fire Poi', 'poi'),
    ('LED Poi', 'poi'),
    ('Staff', 'staff'),
    ('Fire Staff', 'staff'),
    ('LED Staff', 'staff'),
    ('Contact Staff', 'staff'),
    ('Hoop', 'hoop'),
    ('Fire Hoop', 'hoop'),
    ('LED Hoop', 'hoop'),
    ('Rope Dart', 'rope'),
    ('Meteor', 'rope'),
    ('Fans', 'fan'),
    ('Fire Fans', 'fan'),
    ('LED Fans', 'fan'),
    ('Dragon Staff', 'staff'),
    ('Buugeng', 'other'),
    ('Levitation Wand', 'other'),
    ('Club Juggling', 'other'),
    ('Fire Eating', 'other'),
    ('Fire Breathing', 'other');
