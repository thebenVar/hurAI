# hurAI - Project Documentation

## 1. Project Overview

**hurAI** is a modern, Next.js-based helpdesk application designed to streamline support operations. It acts as a central hub for support agents, aggregating communication from various channels and providing powerful tools for ticket management and resolution.

The core philosophy of hurAI is to provide a **Unified Response**—bringing together WhatsApp, Email, Phone, and Internal notes into a single, cohesive interface.

## 2. Core Functionalities

### 2.1. Unified Dashboard
The main dashboard serves as the command center for support agents. It provides a high-level overview of the current state of support operations.

*   **Key Metrics**: Real-time statistics on:
    *   **Total Tickets**: Volume tracking with day-over-day trends.
    *   **Avg. Resolution**: Monitoring efficiency.
    *   **Customer Satisfaction (CSAT)**: Tracking user sentiment.
    *   **Pending Actions**: Highlighting items requiring immediate attention.

### 2.2. Real-time Message Feed
A centralized feed that aggregates incoming messages from multiple sources:
*   **WhatsApp**: Direct integration for instant messaging support.
*   **Email**: Traditional support ticket ingestion.
*   **Internal**: Notes and updates from within the team.
*   **Voice/Video**: Support for rich media types.

Each message is color-coded by source and displays the sender, timestamp, and a snippet of the content, allowing agents to quickly triage incoming requests.

### 2.3. Quick Actions
Located prominently on the dashboard (and optimized for mobile), this module allows for rapid task execution:
*   **Quick Log**: A versatile input field for instantly logging text, voice, image, or video notes.
*   **Open a Ticket**: A direct link to the full manual ticket creation form.
*   **Upload Call Recording**: Access to the experimental call analysis module.
*   **View My Tickets**: Quick navigation to the agent's personal queue.

**Mobile Optimization**: On mobile devices, the Quick Actions panel automatically moves to the top of the screen to prioritize data entry and ticket creation.

## 3. Ticket Management

### 3.1. Manual Ticket Entry
A comprehensive form for logging new incidents, designed for speed and detail.
*   **Smart Categorization**: Visual category selection (Hardware, Software, Network, etc.).
*   **Structured Data**: Fields for Contact, Source, Topic, and detailed Summary.
*   **Problem Analysis**: Dedicated sections for breaking down "Key Issues" and "Potential Causes".
*   **Action Planning**: Initial "Action Points" can be defined right at creation.
*   **Metadata**: Status, Priority, Sentiment, Assignee, and Time Spent tracking.

### 3.2. Ticket Dashboard (Detail View)
Once a ticket is created, the Ticket Dashboard provides a focused workspace for resolution.
*   **Status & Priority Indicators**: Clear visual tags for ticket state.
*   **Quick Insight**: An AI-generated summary and the immediate "Next Action" are highlighted at the top.
*   **Action Points Manager**: A robust to-do list within the ticket. Agents can:
    *   Add, edit, and delete action items.
    *   Mark items as complete.
    *   **Mark as Next Action**: Highlight the single most important next step.
*   **Activity Log**: A chronological timeline of all updates, status changes, and notes.

### 3.3. Knowledge Base Integration
The system proactively suggests relevant Knowledge Base (KB) articles based on the ticket context. Agents can quickly "cite" these articles, adding them to the ticket's activity log as a reference.

## 4. AI & Automation

### 4.1. hurAI
An embedded AI assistant that analyzes system-wide data to identify emerging trends (e.g., "3 emerging trends identified today") and offer insights.

### 4.2. Call Analysis (Experimental)
A module for processing support call recordings.
*   **Audio Upload**: Agents can upload audio files of support calls.
*   **Live Call Assistant**: Intended to provide real-time transcription and analysis.
*   **Automated Extraction**: The system aims to automatically extract key issues, sentiment, and action items from the audio to pre-fill ticket data.

## 5. Technical Architecture

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **UI Components**: Lucide React (Icons), Framer Motion (Animations)
*   **State Management**: React Hooks (useState, useEffect) for local state management.

## 6. Future Roadmap
*   Full integration of the Live Call Assistant.
*   Enhanced AI capabilities for automated ticket routing and response suggestion.
*   Deeper integration with external messaging platforms (WhatsApp Business API, etc.).
