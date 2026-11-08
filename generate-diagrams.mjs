import fs from 'fs';
import path from 'path';

const diagramsDir = path.resolve('diagrams');
if (!fs.existsSync(diagramsDir)) {
  fs.mkdirSync(diagramsDir, { recursive: true });
}

const diagrams = [
  {
    name: 'use-case-diagram',
    code: `flowchart LR
    Student["Student (Participant)"]
    Organizer["Club Organizer"]
    Admin["System Administrator"]
    Guest["Guest Attendee"]

    subgraph ClubSphere["ClubSphere System Boundary"]
        UC_Auth["Sign Up / Login (Google OAuth + Custom JWT)"]
        UC_Cohort["Update Student Cohort Info"]
        UC_ReqOrg["Apply for Organizer Role (Club Selection)"]
        UC_Browse["Browse Approved Events Catalog"]
        UC_Register["Register for Event & Receive Ticket"]
        UC_Vote["Cast Vote in Event Polls"]

        UC_CreateEvt["Create Event (Linked to Club)"]
        UC_ManageEvt["Manage Club Events"]
        UC_ReviewReg["Review & Approve Attendee Registrations"]
        UC_AddExp["Record Event Expense"]

        UC_ApproveOrg["Approve Organizer Request (Enforce Max 2/Club)"]
        UC_DemoteOrg["Demote Organizer to Student"]
        UC_ReviewEvt["Review & Approve Pending Events"]
        UC_AddInc["Record Sponsor / Alumni Income"]
        UC_CancelReg["Cancel Registration & Recalculate Capacity"]
    end

    Student --> UC_Auth
    Student --> UC_Cohort
    Student --> UC_ReqOrg
    Student --> UC_Browse
    Student --> UC_Register
    Student --> UC_Vote

    Guest --> UC_Browse
    Guest --> UC_Register

    Organizer --> UC_Auth
    Organizer --> UC_Browse
    Organizer --> UC_CreateEvt
    Organizer --> UC_ManageEvt
    Organizer --> UC_ReviewReg
    Organizer --> UC_AddExp

    Admin --> UC_Auth
    Admin --> UC_ApproveOrg
    Admin --> UC_DemoteOrg
    Admin --> UC_ReviewEvt
    Admin --> UC_AddInc
    Admin --> UC_CancelReg`
  },
  {
    name: 'class-diagram',
    code: `classDiagram
    class User {
        +String id
        +String name
        +String email
        +String role
        +String department
        +String studentId
        +String batch
        +String section
        +String level
        +String term
        +String mobileNumber
        +String clubAffiliation
        +String organizerRequestStatus
        +String organizerStatus
        +String organizerRejectionReason
        +DateTime createdAt
        +DateTime updatedAt
        +updateProfile()
        +requestOrganizer()
    }

    class Event {
        +String id
        +String title
        +String description
        +String bannerUrl
        +String date
        +String time
        +String venue
        +Number ticketPrice
        +Number capacity
        +Number registeredCount
        +Object items
        +String status
        +String createdBy
        +String organizerId
        +String clubName
        +String rejectionReason
        +DateTime createdAt
        +DateTime updatedAt
        +isFull() Boolean
    }

    class Registration {
        +String id
        +String eventId
        +String clubId
        +String userId
        +Object guest
        +String status
        +String rejectionReason
        +String reviewedBy
        +DateTime reviewedAt
        +String batch
        +String section
        +String tshirtSize
        +String foodType
        +String paymentMethod
        +String paymentStatus
        +String trxId
        +String ticketCode
        +Object received
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Expense {
        +String id
        +String eventId
        +String category
        +Number amount
        +String note
        +String receiptUrl
        +String addedBy
        +DateTime createdAt
    }

    class Income {
        +String id
        +String eventId
        +String source
        +Number amount
        +String type
        +String addedBy
        +DateTime createdAt
    }

    class Poll {
        +String id
        +String eventId
        +String question
        +List~PollOption~ options
        +DateTime expiresAt
        +String createdBy
        +DateTime createdAt
    }

    class PollOption {
        +String id
        +String text
        +Number voteCount
    }

    class Vote {
        +String pollId
        +String userId
        +String selectedOption
        +DateTime votedAt
    }

    User "1" --> "*" Event : creates
    User "1" --> "*" Registration : registers
    User "1" --> "*" Vote : casts
    Event "1" --> "*" Registration : has
    Event "1" --> "*" Expense : incurs
    Event "1" --> "*" Income : receives
    Event "1" --> "*" Poll : features
    Poll "1" *-- "*" PollOption : contains
    Poll "1" --> "*" Vote : records`
  },
  {
    name: 'activity-diagram',
    code: `flowchart TD
    Start(["Student Submits Organizer Request"]) --> SelectClub["Select Desired Club / Society"]
    SelectClub --> CheckRole{"Is User already Organizer or Admin?"}

    CheckRole -->|Yes| RejectEarly["Throw Error: Already holds privileges"]
    CheckRole -->|No| SetPending["Set organizerRequestStatus = pending<br/>Save clubAffiliation in Firestore"]

    SetPending --> LockOut["Frontend ProtectedRoute detects pending status<br/>Redirect to PendingApprovalPage"]
    LockOut --> AdminReviews["Admin opens Users Console / Organizer Requests"]

    AdminReviews --> Decision{"Admin Decision"}

    Decision -->|Reject| EnterReason["Admin inputs rejection reason"]
    EnterReason --> SetReject["Update organizerRequestStatus = rejected<br/>Save rejectionReason"]
    SetReject --> EndReject(["Student Notified / Remains Participant"])

    Decision -->|Approve| StartTx["Start Atomic Firestore Transaction"]
    StartTx --> CountOrganizers["Query current organizers count for requested club"]

    CountOrganizers --> CheckCap{"Active Organizers Count >= 2?"}

    CheckCap -->|Yes| AbortTx["Abort Transaction<br/>Return 400: Capacity Full"]
    AbortTx --> AdminAlert(["Admin alerted to full capacity slot"])

    CheckCap -->|No| CommitTx["Commit Transaction:<br/>Set role = organizer, status = approved"]
    CommitTx --> Unlock["User unlocks Organizer Dashboard"]
    Unlock --> EndApprove(["Process Complete"])`
  },
  {
    name: 'sequence-diagram',
    code: `sequenceDiagram
    autonumber
    actor Attendee as Student / Attendee
    participant Client as React Client (Vite)
    participant API as Express API (/api/v1)
    participant Service as RegistrationService
    participant Repo as RegistrationRepository
    participant DB as Cloud Firestore
    actor Organizer as Club Organizer

    Attendee->>Client: Clicks 'Register Now' & submits options (T-shirt, Food, bKash/Cash)
    Client->>API: POST /api/v1/registrations (Bearer JWT)
    API->>Service: createRegistration(authUserId, inputData)
    Service->>Repo: createRegistrationTransactional(data)

    rect rgb(240, 248, 255)
        Note over Repo,DB: Atomic runTransaction block
        Repo->>DB: Fetch Event document
        DB-->>Repo: Return event (capacity: 100, registeredCount: 42)
        Repo->>Repo: Verify registeredCount < capacity & check duplicate
        Repo->>Repo: Generate unique Ticket Code (e.g., TKT-7K9A2)
        Repo->>DB: Increment event.registeredCount by +1
        Repo->>DB: Insert new Registration record (status: 'pending')
    end

    DB-->>Service: Registration created
    Service-->>API: Return ticket code & pending registration
    API-->>Client: 201 Created { ticketCode, status: 'pending' }
    Client-->>Attendee: Display Ticket Pass & Confirmation Modal

    Organizer->>Client: Navigates to Organizer Dashboard -> Registration Queue
    Client->>API: GET /api/v1/registrations/organizer/pending
    API->>Service: getOrganizerPendingRegistrations(organizerUid)
    Service->>DB: Query registrations for organizer's club
    DB-->>Service: Return pending list
    Service-->>Client: Return hydrated registrations with attendee cohort data
    Client-->>Organizer: Displays pending applicant list

    Organizer->>Client: Clicks 'Accept' on registration
    Client->>API: POST /api/v1/registrations/:id/approve
    API->>Service: updateRegistrationStatusByOrganizer(organizerUid, regId, 'approved')
    Service->>DB: Verify event belongs to organizer's club
    Service->>DB: Update registration status = 'approved', reviewedBy = organizerUid
    DB-->>API: Updated successfully
    API-->>Client: 200 OK
    Client-->>Organizer: Updates UI to 'Accepted' & notifies attendee`
  }
];

async function generateAll() {
  console.log('Generating SVG diagrams in:', diagramsDir);
  for (const d of diagrams) {
    const mmdPath = path.join(diagramsDir, `${d.name}.mmd`);
    const svgPath = path.join(diagramsDir, `${d.name}.svg`);

    // Save .mmd source
    fs.writeFileSync(mmdPath, d.code.trim(), 'utf8');
    console.log(`Saved MMD source: ${d.name}.mmd`);

    // Fetch rendered SVG from mermaid.ink
    const base64 = Buffer.from(d.code.trim()).toString('base64');
    const url = 'https://mermaid.ink/svg/' + base64;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const svg = await res.text();
      if (!svg.includes('<svg') || !svg.includes('</svg>')) {
        throw new Error('Response did not contain valid SVG tags');
      }
      fs.writeFileSync(svgPath, svg, 'utf8');
      console.log(`Generated SVG: ${d.name}.svg (${svg.length} bytes)`);
    } catch (err) {
      console.error(`Error generating ${d.name}.svg:`, err.message);
    }
  }
}

generateAll();
