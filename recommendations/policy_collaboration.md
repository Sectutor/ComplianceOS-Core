# Collaboration & Approval Workflow Recommendations

To enhance the collaboration and approval process for policies in ComplianceOS, we recommend implementing a structured workflow that moves beyond simple status updates.

## 1. Formal Approval Workflow

Currently, users manually toggle status between "Draft", "Review", and "Approved". We should formalize this:

### Proposed Schema Changes (`client_policies` table)
*   **`reviewers`**: `json` array of user IDs who are assigned to review the policy.
*   **`review_due_date`**: `timestamp` for when the review must be completed.
*   **`current_review_status`**: `enum` ('pending', 'changes_requested', 'approved').

### UI Improvements
*   **"Request Review" Button**: Replaces manual status change. Opens a dialog to select reviewers and set a due date.
*   **Reviewer View**: When a reviewer opens the policy, they see a specialized header: *"You have been asked to review this policy by [Date]"* with **Approve** and **Request Changes** buttons.
*   **Gatekeeping**: Disable the "Publish Version" button until the policy is approved (optional strict mode).

## 2. Granular Feedback & Comments

The "Auditor Comments" section is useful but separate from the drafting process.

### Recommendation
*   **Inline Comments**: Implement section-based commenting. Users can highlight a section (or the whole policy) and leave a thread of comments.
*   **Resolution Tracking**: Comments must be "Resolved" before the policy can be approved.

## 3. Activity Timeline

The "History" tab currently shows snapshots. It should also show the *process*.

### Recommendation
*   **Activity Feed**: A sidebar or tab showing detailed events:
    *   *"Alice created draft - 2 days ago"*
    *   *"Bob requested review from Charlie - 1 day ago"*
    *   *"Charlie requested changes: 'Section 4 needs clarification' - 4 hours ago"*
    *   *"Alice updated content - 1 hour ago"*

## 4. Notifications

Keep the team in the loop (email + in-app):
*   **Review Requested**: Notify the assignee.
*   **Changes Requested**: Notify the owner.
*   **Approved**: Notify the owner that they can now Publish.

## Implementation Plan (Phase 1)

1.  **Schema Update**: Add `reviewers` and `review_due_date` to `client_policies`.
2.  **API**: Update `clientPolicies` router to handle `requestReview`, `approve`, and `reject` actions.
3.  **UI**:
    *   Add "Request Review" button to Policy Editor "Quick Actions".
    *   Add visual indicators for "Pending Review" in the policy list.

Would you like to proceed with **Phase 1** (Schema & "Request Review" feature)?
