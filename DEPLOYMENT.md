# Deployment Guide for Education Loan Platform

This guide outlines the steps to deploy the application in a cost-effective, production-ready manner.

## 1. Prerequisites
- **GitHub Account**: For version control.
- **Vercel Account**: For frontend hosting (Free Tier).
- **Render/Railway Account**: For backend hosting (Free Tier/Low Cost).
- **Supabase Account**: For PostgreSQL database (Free Tier).
- **Cloudflare R2 or AWS S3**: For document storage.

## 2. Infrastructure Setup

### Database (Supabase)
1.  Create a new project on Supabase.
2.  Get the `DATABASE_URL` from the settings (Transaction pooler is recommended for serverless).
3.  Replace the `sqlite:///database.db` connection string in `backend/database.py` with the PostgreSQL URL.
    ```python
    # backend/database.py
    DATABASE_URL = os.getenv("DATABASE_URL")
    ```

### Storage (Cloudflare R2 / AWS S3)
*Note: Storing files locally on Render/Heroku is bad practice as they are ephemeral file systems.*
1.  Create a bucket (e.g., `loan-docs`).
2.  Update `backend/routers/documents.py` to upload files to S3/R2 using `boto3`.

### Backend (Render/Railway)
1.  Connect your GitHub repo.
2.  Set Build Command: `pip install -r requirements.txt`
3.  Set Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
4.  Add Environment Variables:
    -   `DATABASE_URL`: (From Supabase)
    -   `SECRET_KEY`: (Generate a secure random string)
    -   `FRONTEND_URL`: `https://your-vercel-app.vercel.app`
    -   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (For storage)

### Frontend (Vercel)
1.  Import the `frontend` folder of the repo.
2.  Set Environment Variables:
    -   `NEXT_PUBLIC_API_URL`: `https://your-backend-app.onrender.com`

---

## 3. Production Features needed before Deployment

### A. Communication Channels (Notifications)
To enable push notifications to WhatsApp and Email:

**1. Email (Amazon SES or SendGrid)**
-   **Service**: Amazon SES is cheapest (~$0.10/1000 emails).
-   **Implementation**:
    -   Verify domain identity.
    -   Use `boto3` to send emails in `backend/routers/notifications.py`.
    ```python
    import boto3
    ses = boto3.client('ses', region_name='us-east-1')
    def send_email(to_address, subject, body):
        ses.send_email(
            Source='noreply@yourdomain.com',
            Destination={'ToAddresses': [to_address]},
            Message={...}
        )
    ```

**2. WhatsApp (Meta Cloud API)**
-   **Service**: Meta Cloud API (First 1000 service conversations free/month).
-   **Implementation**:
    -   Create a Facebook Developer App.
    -   Get a Permanent Access Token.
    -   Send POST requests to `https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages`.

### B. Security Improvements
1.  **CORS**: Ensure `allow_origins` in `backend/main.py` strictly matches your frontend domain.
2.  **HTTPS**: Render/Vercel handle this automatically.
3.  **Input Validation**: Ensure all Pydantic models have strict typing.
4.  **Auth**: Implement JWT Expiration and Refresh Tokens. Current implementation is a basic MVP.

### C. File Storage (Secure)
Currently, specific files are stored on disk. Update `backend/routers/documents.py`:

```python
# Pseudo-code for S3 Upload
s3.upload_fileobj(file.file, 'bucket-name', file.filename)
url = s3.generate_presigned_url(...)
doc.file_path = url # Store URL instead of local path
```

---

## 4. UI/UX Polishing Checklist
-   [x] **Student Dashboard**: Added Stepper UI for status tracking.
-   [x] **Admin Dashboard**: Fixed table layouts and added sticky headers.
-   [ ] **Mobile Responsiveness**: Test tables on mobile (overflow-x-auto is added).
-   [ ] **Loading States**: Add skeletons instead of "Loading..." text for better UX.

## 5. Cost Estimate (Monthly)
| Service | Tier | Cost |
| :--- | :--- | :--- |
| **Vercel** | Hobby | $0 |
| **Render** | Free/Starter | $0 - $7 |
| **Supabase** | Free | $0 |
| **Cloudflare R2** | Free (10GB) | $0 |
| **Domain** | Namecheap | ~$10/year |
| **Total** | | **~$0 - $7 / month** |
