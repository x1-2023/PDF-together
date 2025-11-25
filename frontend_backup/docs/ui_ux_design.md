# UI/UX Design Specifications

## 1. Design System

### Color Palette ("Study Focus" Theme)
The design uses a warm, earthy palette inspired by "Terracotta" and "Old Paper" to create a cozy study environment.

| Token | Color | Hex | Description |
| :--- | :--- | :--- | :--- |
| **Primary** | Terracotta | `#E8845B` | Main action buttons, active states, highlights. |
| **Secondary** | Gold/Mustard | `#C8B162` | Accents, warnings, secondary highlights. |
| **Background (Light)** | Warm Milky Yellow | `#FAF3E0` | Main application background in light mode. |
| **Surface (Light)** | Very Light Cream | `#FFFDF5` | Cards, sidebars, panels in light mode. |
| **Text (Light)** | Sepia/Dark Brown | `#5D4037` | Primary text color. |
| **Background (Dark)** | Dark Brown/Black | `#1F1B16` | Main application background in dark mode. |
| **Surface (Dark)** | Dark Coffee | `#2A251F` | Cards, sidebars, panels in dark mode. |
| **Text (Dark)** | Cream | `#EAE0CC` | Primary text color in dark mode. |

### Typography
- **Display**: `Lexend` (Headings, Buttons) - Friendly, geometric, readable.
- **Body**: `Nunito` (Paragraphs, UI Text) - Rounded, approachable.
- **Serif**: `Lora` (PDF Text fallback, Quotes) - Classic, elegant.

### Spacing & Shadows
- **Shadows**: Soft, diffused shadows (`box-shadow: 0 4px 20px rgba(93, 64, 55, 0.05)`) to create depth without harshness.
- **Border Radius**: Generous rounding (`rounded-xl`, `rounded-2xl`) for a friendly feel.

## 2. Layout Structure

### Main Reader Layout
A 3-column layout optimized for reading and collaboration.

```
+---------------------------------------------------------------+
|  [Left Sidebar]  |      [Main Content Area]      | [Right Sidebar] |
|                  |                               |                 |
|  - Thumbnails    |  +-------------------------+  | - Chat          |
|  - Outline       |  |      [Toolbar]          |  | - AI Assistant  |
|  - Bookmarks     |  +-------------------------+  | - Users         |
|                  |                               |                 |
|  (Resizable)     |  [Virtualized PDF Canvas]     | (Resizable)     |
|                  |                               |                 |
|                  |                               |                 |
+---------------------------------------------------------------+
```

- **Left Sidebar**: 250px default width. Collapsible. Contains PDF navigation.
- **Right Sidebar**: 320px default width. Collapsible. Contains collaboration tools.
- **Main Content**: Flex-grow. Contains the floating toolbar and the main PDF viewer.

## 3. Component Specifications

### Toolbar (Floating)
- **Position**: Top center of the Main Content Area.
- **Style**: Glassmorphism effect (blur background), rounded capsule shape (`rounded-full`), white/dark-surface background with subtle border.
- **Tools**:
    - **Navigation Group**:
        - `Prev/Next`: Simple chevron icons.
        - `Page Input`: "Page X of Y". Click to edit.
    - **Zoom Group**:
        - `Zoom Out (-)` / `Zoom In (+)`: 10% increments.
        - `Percentage`: Click to reset to 100%.
    - **Annotation Tools** (Active state: Primary color bg + White icon):
        - **Cursor (Select)**: Default tool. Select, move, resize annotations.
        - **Pen**:
            - *Options*: Color Picker (Terracotta, Black, Blue, Red), Thickness Slider.
            - *Interaction*: Freehand drawing. Smooth curves.
        - **Highlighter**:
            - *Options*: Colors (Yellow, Green, Blue, Pink - all transparent/multiply mode).
            - *Interaction*: Draws behind text or with multiply blend mode.
        - **Eraser**:
            - *Interaction*: Click to delete entire object (stroke/shape) or drag to erase pixels (if bitmap). *Default: Object Eraser*.
        - **Text**:
            - *Options*: Font Family (Lexend/Nunito), Size, Color.
            - *Interaction*: Click to place cursor, type immediately. Auto-expand width.
        - **Sticky Note**:
            - *Visual*: Small square icon.
            - *Interaction*: Drag & drop to place. Expands to a yellow/pink/blue note with close button.
    - **Actions Group**:
        - `Undo/Redo`: History navigation.
        - `Save`: Manual save trigger (auto-save enabled).

### Virtualized PDF Canvas
- **Rendering**: Uses `react-pdf` to render pages.
- **Virtualization**: `react-window` VariableSizeList. Only renders visible pages + buffer.
- **Interactions**:
    - **Scroll**: Smooth vertical scrolling.
    - **Zoom**: Ctrl+Scroll to zoom.
    - **Drawing**: Canvas overlay on top of PDF pages for annotations.

### Sidebars
- **Left (Thumbnails)**:
    - Virtualized list of page thumbnails.
    - Active page highlighted with Primary color border.
    - Click to jump to page.
- **Right (Chat/AI)**:
    - **Tabs**: Chat / AI / Users.
    - **Chat**: Bubble-style messages. User avatars.
    - **AI**: Markdown rendering for AI responses. "Ask AI" input field.

### Loading State (`CatLoader`)
- **Visual**: A cute animated cat (SVG/CSS) sleeping or playing.
- **Context**: Displayed during heavy operations (e.g., processing PDF).
- **Text**: "Đang xử lý..." or friendly messages.

### Page Loader (Document Theme)
- **Visual**: Minimalist animation of a document icon with a scanning effect or pages turning.
- **Context**: Initial application load / Page refresh.
- **Style**: Clean, professional, using Primary color.
- **Text**: "Đang tải tài liệu..."

## 4. Interactions & Animations
- **Hover Effects**: Buttons lift slightly (`-translate-y-1`) and glow.
- **Transitions**: Smooth color transitions (`duration-300`) for Dark/Light mode toggle.
- **Feedback**: Toast notifications for actions (e.g., "Copied to clipboard", "Saved").
- **Resizing**: Drag handles between sidebars and main content.

## 5. Dashboard & Modals

### Dashboard (Home)
- **Header**: Sticky, glassmorphism (`backdrop-blur-xl`). Contains Logo (Gradient text), Settings button, and User Avatar.
- **Welcome Section**: Large greeting text ("Chào mừng trở lại!") with subtext.
- **Tabs**: Pill-shaped tabs for filtering sessions (All, Active, Upcoming, Completed). Active tab has white background and shadow.
- **Grid Layout**: Responsive grid (1 col mobile -> 4 cols xl) for session cards.

### Session Cards
- **Appearance**: Rounded corners (`rounded-2xl`), subtle shadow.
- **Cover Image**: PDF thumbnail or random abstract cover.
- **Hover Effects**:
    - Card lifts up (`-translate-y-2`).
    - Shadow increases (`shadow-float`).
    - "Enter" button (arrow icon) fades in center.
    - "Delete" button appears in top-right corner.
- **Status Badge**: Small pill badge indicating session status (Active/Upcoming/Completed).

### Modals
- **Create Session Modal**:
    - **Upload Area**: Dashed border box. Drag & drop support. Shows file info (Name, Size) and Progress Bar when uploading.
    - **Input**: "Session Name" field with floating label style.
    - **Actions**: "Cancel" (Ghost) and "Start Now" (Primary, large shadow).
- **Delete Confirmation**:
    - **Style**: Warning theme (Red accents).
    - **Content**: Warning icon, confirmation text.
    - **Actions**: "Cancel" and "Delete Permanently" (Red).

### Floating Action Button (FAB)
- **Position**: Bottom-right fixed.
- **Style**: Large pill shape, Primary/Dark background, Shadow-2xl.
- **Icon**: Plus icon + "New Session" text.
