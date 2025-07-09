# Authentication Flow Diagram

## End-to-End Login and Authentication Process

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React Frontend
    participant H as useAuthActions Hook
    participant C as Convex Client
    participant B as Convex Backend
    participant A as Convex Auth
    participant DB as Database

    %% Login Flow
    U->>UI: Enter email/password
    UI->>H: Call signIn()
    H->>C: Invoke auth.signIn action
    C->>B: HTTP Request
    B->>A: Validate credentials
    
    alt Valid Credentials
        A->>A: Generate session token
        A->>DB: Store session
        A-->>B: Return user + token
        B-->>C: Success response
        C-->>H: Update auth state
        H-->>UI: Redirect to dashboard
        UI-->>U: Show authenticated UI
    else Invalid Credentials
        A-->>B: Return error
        B-->>C: Error response
        C-->>H: Handle error
        H-->>UI: Show error message
        UI-->>U: Display login error
    end

    %% Session Check
    Note over UI,DB: On Page Load/Refresh
    UI->>H: Check useCurrentUser()
    H->>C: Query current session
    C->>B: WebSocket query
    B->>DB: Verify session token
    
    alt Valid Session
        DB-->>B: Return user data
        B-->>C: User object
        C-->>H: Update state
        H-->>UI: User authenticated
    else Invalid/No Session
        DB-->>B: Return null
        B-->>C: No user
        C-->>H: Update state
        H-->>UI: Redirect to login
    end

    %% Logout Flow
    U->>UI: Click logout
    UI->>H: Call signOut()
    H->>C: Invoke auth.signOut
    C->>B: HTTP Request
    B->>DB: Delete session
    DB-->>B: Confirmed
    B-->>C: Success
    C-->>H: Clear auth state
    H-->>UI: Redirect to login
    UI-->>U: Show login page
```

## Key Components

### Frontend
- **AuthLayout**: Wraps auth pages, handles redirects
- **useAuthActions**: Hook providing signIn/signUp/signOut functions
- **useCurrentUser**: Hook for checking current auth state

### Backend
- **Convex Auth**: Built-in authentication system
- **Password Provider**: Handles email/password authentication
- **Session Management**: Automatic session token handling

### Data Flow
1. **Login**: UI → useAuthActions → Convex Action → Auth Provider → Database
2. **Session Check**: UI → useCurrentUser → Convex Query → Database
3. **Logout**: UI → useAuthActions → Convex Action → Database

### Security Features
- Password hashing (handled by Convex Auth)
- Session tokens stored securely
- Automatic session expiration
- HTTPS-only in production