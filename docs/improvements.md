# Session Combat - Implementation Roadmap

## Completed ✅

### Phase 1: Foundation & Infrastructure
- [x] Add MongoDB, bcryptjs, jsonwebtoken dependencies
- [x] Create MongoDB connection utility (`lib/db.ts`)
- [x] Update type system for multi-tenant support (`lib/types.ts`)
- [x] Create authentication utilities (`lib/auth.ts`)
  - Password hashing with bcrypt
  - JWT token generation and verification
  - Email and password validation
- [x] Create authentication middleware (`lib/middleware.ts`)
  - Token extraction from cookies/headers
  - Auth verification for protected routes
  - HTTP-only cookie management
- [x] Create authentication API routes
  - `/api/auth/register` - User registration with validation
  - `/api/auth/login` - User login with password verification
  - `/api/auth/logout` - Logout with cookie cleanup
  - `/api/auth/me` - Current user info endpoint
- [x] Create useAuth hook (`lib/hooks/useAuth.ts`)
  - Client-side authentication state management
  - Register, login, logout functions
  - Auth status and loading states
- [x] Update storage layer (`lib/storage.ts`)
  - Converted from localStorage to MongoDB
  - Async server-side functions for data persistence
  - Multi-tenant data filtering by userId

---

## Remaining Tasks ⏳

### Phase 2: Frontend Authentication UI

#### Step 1: Create Login Page
**File:** `/app/login/page.tsx`
- Email and password input fields
- Form validation and error display
- Integration with `useAuth().login()`
- Redirect to home on successful login
- Link to register page for new users
- Loading state during login

#### Step 2: Create Register Page
**File:** `/app/register/page.tsx`
- Email and password input fields
- Password confirmation field
- Display password strength requirements
- Form validation before submission
- Integration with `useAuth().register()`
- Handle registration errors (duplicate email, weak password)
- Redirect to home on successful registration
- Link to login page for existing users

#### Step 3: Create Protected Route Component
**File:** `/lib/components/ProtectedRoute.tsx`
- Wrap components that require authentication
- Check `useAuth().isAuthenticated`
- Show loading state while checking auth
- Redirect to login if not authenticated
- Display error message if auth check fails

#### Step 4: Update Home Page
**File:** `/app/page.tsx`
- Add user greeting (display user email)
- Add logout button
- Redirect to login if not authenticated
- Show loading state on initial mount

---

### Phase 3: API Updates with Authentication & MongoDB

#### Step 5: Create Encounters API
**Files:** 
- `/pages/api/encounters.ts` (GET, POST)
- `/pages/api/encounters/[id].ts` (GET, PUT, DELETE)

**Requirements:**
- Require authentication via `requireAuth()` middleware
- Extract `userId` from auth token
- GET `/api/encounters` - List all encounters for user
- POST `/api/encounters` - Create new encounter (include userId)
- GET `/api/encounters/[id]` - Get single encounter (verify ownership)
- PUT `/api/encounters/[id]` - Update encounter (verify ownership)
- DELETE `/api/encounters/[id]` - Delete encounter (verify ownership)
- All operations must filter by userId

**MongoDB Collection:** `encounters`
```javascript
{
  _id: ObjectId,
  id: string (uuid),
  userId: string,
  name: string,
  description: string,
  monsters: Monster[],
  createdAt: Date,
  updatedAt: Date
}
```

#### Step 6: Create Players API
**Files:**
- `/pages/api/players.ts` (GET, POST)
- `/pages/api/players/[id].ts` (GET, PUT, DELETE)

**Requirements:**
- Same authentication and userId filtering as Encounters
- GET `/api/players` - List all players for user
- POST `/api/players` - Create new player
- GET `/api/players/[id]` - Get single player (verify ownership)
- PUT `/api/players/[id]` - Update player (verify ownership)
- DELETE `/api/players/[id]` - Delete player (verify ownership)

**MongoDB Collection:** `players`
```javascript
{
  _id: ObjectId,
  id: string (uuid),
  userId: string,
  name: string,
  hp: number,
  maxHp: number,
  ac: number,
  initiativeBonus: number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Step 7: Update Items API
**File:** `/pages/api/items.ts`

**Requirements:**
- Require authentication
- Filter items by userId
- GET `/api/items` - List all items for user
- POST `/api/items` - Create new item with userId

**MongoDB Collection:** `items`
```javascript
{
  _id: ObjectId,
  id: string (uuid),
  userId: string,
  name: string,
  description: string,
  ... (other item properties),
  createdAt: Date,
  updatedAt: Date
}
```

#### Step 8: Create Combat State API
**Files:**
- `/pages/api/combat.ts` (GET, POST)
- `/pages/api/combat/[id].ts` (GET, PUT, DELETE)

**Requirements:**
- Require authentication
- Filter by userId
- GET `/api/combat` - Get current combat state for user
- POST `/api/combat` - Create new combat session
- PUT `/api/combat/[id]` - Update combat state (add/remove combatants, update initiative)
- DELETE `/api/combat/[id]` - End combat session

**MongoDB Collection:** `combatStates`
```javascript
{
  _id: ObjectId,
  id: string (uuid),
  userId: string,
  encounterId: string (optional),
  combatants: CombatantState[],
  currentRound: number,
  currentTurnIndex: number,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### Phase 4: Frontend Component Updates

#### Step 9: Update Encounters Page
**File:** `/app/encounters/page.tsx`
- Wrap with ProtectedRoute
- Use fetch to GET `/api/encounters`
- Implement create encounter form (POST to `/api/encounters`)
- List encounters from API instead of localStorage
- Add edit/delete buttons
- Handle loading and error states

#### Step 10: Update Players Page
**File:** `/app/players/page.tsx`
- Wrap with ProtectedRoute
- Use fetch to GET `/api/players`
- Implement create player form (POST to `/api/players`)
- List players from API instead of localStorage
- Add edit/delete buttons
- Handle loading and error states

#### Step 11: Update Combat Page
**File:** `/app/combat/page.tsx`
- Wrap with ProtectedRoute
- Use fetch to GET `/api/combat`
- Implement combat session UI using API data
- Update combat state via PUT `/api/combat/[id]`
- Handle combatant management
- Persist changes to MongoDB via API

---

### Phase 5: Testing & Validation

#### Step 12: Write Integration Tests
**File:** `/tests/integration/auth.integration.test.ts`
- Test user registration with valid/invalid inputs
- Test login with correct/incorrect credentials
- Test logout
- Test token validation
- Test multi-user data isolation
- Verify password hashing works correctly

**File:** `/tests/integration/api.integration.test.ts`
- Test GET `/api/encounters` returns only user's encounters
- Test POST `/api/encounters` creates encounter with correct userId
- Test DELETE `/api/encounters/[id]` fails for other users' encounters
- Similar tests for players, items, and combat
- Test 401 responses when not authenticated

#### Step 13: Security Review
- Verify all API routes require authentication
- Verify all queries filter by userId
- Test that users cannot access other users' data
- Run Codacy analysis on new code
- Check for SQL injection risks (MongoDB injection)
- Verify password requirements are enforced

#### Step 14: Manual Testing
- Test registration with weak passwords
- Test login with wrong credentials
- Test logout and session clearing
- Test creating/editing/deleting data
- Test data isolation between users
- Test token expiration (currently 7 days)
- Test refresh token flow if implementing

---

## Environment Setup

### .env.local Configuration
```bash
# MongoDB Configuration
MONGODB_URI=<your-connection-url>
MONGODB_DB=session-combat

# JWT Configuration
JWT_SECRET=<your-secret-key-change-in-production>

# Node Environment
NODE_ENV=development
```

**Note:** Replace `<your-connection-url>` with your actual MongoDB connection string (Atlas or local)

---

## Architecture Overview

```
Authentication Flow:
┌─────────────┐
│   Browser   │
└─────┬───────┘
      │ 1. POST /api/auth/register or /api/auth/login
      ▼
┌─────────────────────────────────────┐
│   API Routes (/api/auth/*)          │
│  - Validate credentials              │
│  - Generate JWT token               │
│  - Set HTTP-only cookie             │
└─────┬───────────────────────────────┘
      │ 2. Token in cookie
      ▼
┌─────────────────────────────────────┐
│   All Protected API Routes          │
│  - Extract token from cookie        │
│  - Verify JWT signature             │
│  - Extract userId                   │
│  - Filter queries by userId         │
└─────────────────────────────────────┘
      │ 3. Return user-scoped data
      ▼
┌─────────────┐
│   Browser   │
└─────────────┘
```

```
Data Flow:
┌──────────────┐
│  Components  │ (useAuth hook, ProtectedRoute)
└──────┬───────┘
       │ fetch /api/*
       ▼
┌──────────────────────────────────────┐
│  API Routes (/pages/api/*)           │
│  - Extract userId from token         │
│  - Validate ownership                │
│  - Call storage.* functions          │
└──────┬───────────────────────────────┘
       │ storage.* (async)
       ▼
┌──────────────────────────────────────┐
│  MongoDB Storage Layer (lib/storage) │
│  - Connect to DB                     │
│  - Query with userId filter          │
│  - Insert/Update/Delete              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  MongoDB Database                    │
│  - users collection                  │
│  - encounters collection (userId)    │
│  - players collection (userId)       │
│  - items collection (userId)         │
│  - combatStates collection (userId)  │
└──────────────────────────────────────┘
```

---

## Implementation Order (Recommended)

1. **Setup** - Provide MongoDB connection URL → Update .env.local
2. **Phase 2** - Create login/register pages and ProtectedRoute
3. **Phase 3** - Implement API routes (encounters, players, items, combat)
4. **Phase 4** - Update existing components to use new APIs
5. **Phase 5** - Write tests and verify security

---

## Notes

- All timestamps use JavaScript `Date` objects which MongoDB stores as ISODate
- UUIDs are generated on the client/server using `crypto.randomUUID()`
- Passwords are hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 7 days (configurable in `lib/auth.ts`)
- All API responses should include proper error messages
- Client-side validation should mirror server-side validation
- Loading states should be shown during async operations
- Errors should be displayed to users clearly
