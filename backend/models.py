from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    telegram_id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    balance = Column(Integer, default=0)
    referrer_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks_completed = relationship("TaskComplete", back_populates="user")
    withdrawals = relationship("Withdrawal", back_populates="user")

class TaskComplete(Base):
    __tablename__ = "tasks_completed"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.telegram_id"))
    task_id = Column(String)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tasks_completed")

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.telegram_id"))
    player_id = Column(String)
    uc_amount = Column(Integer)
    cost = Column(Integer)
    status = Column(String, default="pending") # pending, completed, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="withdrawals")
