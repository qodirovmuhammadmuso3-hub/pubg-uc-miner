from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional

from . import models, database

# Ma'lumotlar bazasini yaratish
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="PUBG UC Earn API")

# CORS sozlamalari (Frontend ulanishi uchun)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Haqiqiy loyihada buni cheklash kerak
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/init")
async def init_user(
    userId: int = Body(...),
    username: str = Body(...),
    referrerId: Optional[int] = Body(None),
    db: Session = Depends(database.get_db)
):
    # Foydalanuvchini tekshirish
    db_user = db.query(models.User).filter(models.User.telegram_id == userId).first()
    
    if not db_user:
        # Yangi foydalanuvchi yaratish
        db_user = models.User(telegram_id=userId, username=username, referrer_id=referrerId, balance=0)
        db.add(db_user)
        
        # Referal uchun bonus berish
        if referrerId and referrerId != userId:
            referrer = db.query(models.User).filter(models.User.telegram_id == referrerId).first()
            if referrer:
                referrer.balance += 100 # Referal bonus
                
        db.commit()
        db.refresh(db_user)
    
    # Bugungi ishlagan coinlarni hisoblash
    today = date.today()
    today_tasks = db.query(models.TaskComplete).filter(
        models.TaskComplete.user_id == userId,
        models.TaskComplete.completed_at >= datetime.combine(today, datetime.min.time())
    ).all()
    
    # Jami chiqarilgan UC
    withdrawals = db.query(models.Withdrawal).filter(
        models.Withdrawal.user_id == userId,
        models.Withdrawal.status == "completed"
    ).all()
    total_withdrawn = sum(w.uc_amount for w in withdrawals)
    
    # Referallar soni
    ref_count = db.query(models.User).filter(models.User.referrer_id == userId).count()
    
    return {
        "balance": db_user.balance,
        "todayEarned": sum(50 for _ in today_tasks), # Sodda hisob (keyinchalik task rewardga qarab o'zgartirish mumkin)
        "totalWithdrawn": total_withdrawn,
        "refs": ref_count,
        "tasksCompleted": len(db_user.tasks_completed)
    }

@app.post("/api/tasks/complete")
async def complete_task(
    userId: int = Body(...),
    taskId: str = Body(...),
    reward: int = Body(...),
    db: Session = Depends(database.get_db)
):
    # Bugun bu vazifa bajarilganmi?
    today = date.today()
    existing = db.query(models.TaskComplete).filter(
        models.TaskComplete.user_id == userId,
        models.TaskComplete.task_id == taskId,
        models.TaskComplete.completed_at >= datetime.combine(today, datetime.min.time())
    ).first()
    
    if existing and not taskId.startswith("watch_ad"): # Reklamani bir necha bor ko'rish mumkin deb hisoblasak
        raise HTTPException(status_code=400, detail="Vazifa bugun bajarilgan")
    
    # Vazifani saqlash
    task = models.TaskComplete(user_id=userId, task_id=taskId)
    db.add(task)
    
    # Balansni yangilash
    user = db.query(models.User).filter(models.User.telegram_id == userId).first()
    if user:
        user.balance += reward
        db.commit()
        return {"new_balance": user.balance}
    
    raise HTTPException(status_code=404, detail="User topilmadi")

@app.post("/api/withdraw")
async def withdraw(
    userId: int = Body(...),
    playerId: str = Body(...),
    ucAmount: int = Body(...),
    cost: int = Body(...),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.telegram_id == userId).first()
    if not user or user.balance < cost:
        raise HTTPException(status_code=400, detail="Mablag' yetarli emas")
    
    # So'rov yaratish
    withdrawal = models.Withdrawal(
        user_id=userId,
        player_id=playerId,
        uc_amount=ucAmount,
        cost=cost
    )
    db.add(withdrawal)
    
    # Balansdan ayirish
    user.balance -= cost
    db.commit()
    
    return {"status": "success", "new_balance": user.balance}

@app.get("/api/user/{userId}/done_tasks")
async def get_done_tasks(userId: int, db: Session = Depends(database.get_db)):
    today = date.today()
    done = db.query(models.TaskComplete).filter(
        models.TaskComplete.user_id == userId,
        models.TaskComplete.completed_at >= datetime.combine(today, datetime.min.time())
    ).all()
    return [d.task_id for d in done]
