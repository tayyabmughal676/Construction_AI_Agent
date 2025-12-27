# 📡 Backend API Integration Requirements

This document outlines the specific API endpoints required by the frontend application to replace currently mocked data and enable full dynamic functionality.

## 1. Core Systems (Already Integrated)
These endpoints are currently used for the "Live" system status and the "Intelligence Terminal".

| Feature | Endpoint | Method | Status |
| :--- | :--- | :--- | :--- |
| **System Health** | `/api/health` | GET | ✅ Connected |
| **Unified Agent** | `/api/agents/chat` | POST | ✅ Connected |
| **Capabilities** | `/api/agents/capabilities` | GET | ✅ Connected |
| **Workflows List** | `/api/workflows/list` | GET | ✅ Connected |
| **Execute Workflow**| `/api/workflows/langgraph/execute` | POST | ✅ Connected |

---

## 2. Department Data Requirements (Integration Pending)
The following data is currently hardcoded in the frontend views and requires dedicated backend endpoints.

### 👥 Human Resources (HR Hub)
*   **Endpoint**: `GET /api/hr/employees`
*   **Description**: Returns the full workforce directory.
*   **Desired Response**:
    ```json
    {
      "employees": [
        { "id": "1", "name": "Sarah Connor", "role": "Site Manager", "department": "Construction", "status": "Active" }
      ]
    }
    ```

### 🏗️ Construction (Site Terminal)
*   **Endpoint**: `GET /api/construction/projects`
*   **Description**: Returns active and pending construction projects.
*   **Desired Response**:
    ```json
    {
      "projects": [
        { "id": "1", "name": "Skyline Tower", "location": "New York", "budget": "125M", "progress": 68, "status": "On Track" }
      ]
    }
    ```

### 🏭 Manufacturing (Fabrication Node)
*   **Endpoint**: `GET /api/manufacturing/inventory`
*   **Description**: Returns real-time stock levels of components.
*   **Desired Response**:
    ```json
    {
      "inventory": [
        { "component": "Hydraulic Actuators", "sku": "HA-402", "stock": 124, "status": "Optimal", "location": "Rack A-04" }
      ]
    }
    ```

*   **Endpoint**: `GET /api/manufacturing/stats`
*   **Description**: Returns production metrics (OEE, Line status).
*   **Desired Response**:
    ```json
    { "oee": "94.2%", "activeLines": "12/14", "qcPassRate": "99.8%" }
    ```

---

## 3. Implementation Plan
1.  **Backend Implementation**: Update the backend services to expose these endpoints.
2.  **API Service Update**: Add corresponding methods to `src/services/apiService.ts`.
3.  **View Integration**: Replace static constants in `HR.tsx`, `Construction.tsx`, and `Manufacturing.tsx` with `useQuery` hooks.
