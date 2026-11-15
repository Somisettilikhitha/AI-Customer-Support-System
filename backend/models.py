from datetime import datetime, timezone

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Text,
    Float,
    Boolean,
    func,
)

from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column
)


# ============================================================
# BASE
# ============================================================

class Base(DeclarativeBase):
    pass


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(100)
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255)
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="customer"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# TICKET
# ============================================================

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="open",
        nullable=False
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="medium",
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(50),
        default="general",
        nullable=False
    )

    sentiment: Mapped[str] = mapped_column(
        String(20),
        default="neutral",
        nullable=False
    )

    ai_confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    ai_response: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    assigned_agent_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


# ============================================================
# TICKET MESSAGE
# ============================================================

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    # --------------------------------------------------------
    # Unique message ID
    # --------------------------------------------------------

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    # --------------------------------------------------------
    # Ticket associated with this message
    # --------------------------------------------------------

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"),
        nullable=False
    )

    # --------------------------------------------------------
    # Sender ID
    #
    # Customer message:
    #     sender_id = customer user ID
    #
    # Agent message:
    #     sender_id = agent user ID
    #
    # AI message:
    #     sender_id = None
    #
    # Therefore this field must allow NULL.
    # --------------------------------------------------------

    sender_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    # --------------------------------------------------------
    # Sender role
    #
    # Expected values:
    #
    # customer
    # agent
    # ai
    # --------------------------------------------------------

    sender_role: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    # --------------------------------------------------------
    # Message content
    # --------------------------------------------------------

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # --------------------------------------------------------
    # Message creation time
    # --------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# ============================================================
# TICKET ACTIVITY / AUDIT LOG
# ============================================================

class TicketActivity(Base):
    __tablename__ = "ticket_activities"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"),
        nullable=False
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    old_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    new_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

# ============================================================
# PASSWORD RESET TOKEN 
# ============================================================

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ============================================================
# NOTIFICATIONS
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    # Unique notification ID
    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    # User who receives the notification
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Ticket related to this notification
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"),
        nullable=False,
        index=True
    )

    # Notification type
    # Examples: ticket_assigned, new_message, status_changed
    notification_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    # Notification heading
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    # Notification description
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # Whether the notification has been read
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Notification creation time
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )