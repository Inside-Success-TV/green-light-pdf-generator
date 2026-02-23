# Standard Operating Procedure (SOP) - Casting Intelligence Dashboard

## 1. Project Overview

The **Casting Intelligence Dashboard** is an AI-powered internal tool for **Inside Success Network**. It streamlines the transformation of raw call transcripts into high-fidelity "Greenlight PDF Letters" and "Casting Cheat Sheets."

## 2. Technical Architecture

- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion.
- **Backend Services**: n8n Webhooks (Story Generation, PDF Creation, Compliance Review).
- **Branding**: Inside Success Network (Gold/Dark/Accent theme).

## 3. Core Workflows

### 3.1. Document Generation (Workflow 1)

1. **Input**: User pastes raw transcript and selects an action (e.g., "Generate Casting Cheat Sheet").
2. **Preprocessing**: Dashboard cleans timestamps and filler text locally.
3. **Execution**: Sends cleaned text to the `STORY_WEBHOOK_URL`.
4. **Output**: Receives a formatted document (HTML or Markdown).

### 3.2. PDF / Google Doc Creation (Workflow 2)

1. **Trigger**: User clicks "Create PDF" on a generated result.
2. **Sync**: Sends a 5-field payload to the `PDF_WEBHOOK_URL`:
   - `content`: Clean text (HTML tags stripped proactively).
   - `transcript`: The original raw transcript (preserved from generation).
   - `action`: The document type.
   - `show_name` / `client_name`: Detected automatically for branding.
3. **Fulfillment**: n8n creates the Document and saves it to the integrated Google Drive folder.

## 4. Virtual Assistant (VA) Workflow

### 4.1. Editing and Previewing

- **Styled Preview**: The dashboard renders HTML/Markdown with full styling (colored headers, brand fonts) in "Preview Mode."
- **VA Editor Mode**: Swapping to "Edit Mode" automatically strips technical HTML tags, presenting the VA with clean, editable text.
- **Formatting Toolbar**: Use the toolbar to apply **Bold**, _Italic_, **Headers**, or **Lists**. These are converted to Markdown tags internally.
- **AI Revise**: Use the "AI Revamp" bar to send specific instructions (e.g., "Make the client look like a hero") back to the AI for a rewrite.

### 4.2. Best Practices

- **Highlighting**: Always highlight the text before clicking a toolbar button.
- **Switching Modes**: Before creating a PDF, switch back to "Preview Mode" to ensure the final layout looks correct.

## 5. Maintenance & Troubleshooting

### 5.1. Webhook Settings

If the dashboard reports an error:

- Ensure n8n webhooks are set to **POST** method.
- Webhook "Respond" setting must be: **Using Respond to Webhook Node**.

### 5.2. Missing Logos

If show logos aren't appearing in the final Google Doc:

- Check the `show_name` field in the payload sent from the dashboard.
- Ensure the show name matches one of the categories in the n8n **Text Classifier** node.

### 5.3. Environment Variables

Ensure the `.env.local` or Vercel production settings contain:

- `VITE_WEBHOOK_URL`
- `VITE_PDF_WEBHOOK_URL`
- `VITE_EDIT_WEBHOOK_URL`
