import { twMerge } from "tailwind-merge";

// Shared Tailwind v4 recipes. Keep utility names literal so the compiler can scan them.
// Semantic hooks are retained for charts, state variants and browser checks.
const styles = {
  "sidebar": [
    "fixed inset-y-0 left-0 z-50 flex w-[222px] flex-col border-r border-border bg-sidebar px-[18px] pb-4 pt-6",
    "transition-[width,transform] duration-200 max-[1250px]:w-[195px] [&.is-collapsed]:w-[76px] [&.is-collapsed]:px-3",
    "[&.is-collapsed_.sidebar-label]:hidden [&.is-collapsed_.brand]:justify-center [&.is-collapsed_.nav-item]:justify-center",
    "[&.is-collapsed_.nav-item]:px-0 [&.is-collapsed_.workspace-profile]:justify-center [&_nav]:grid [&_nav]:gap-1",
    "max-[700px]:invisible max-[700px]:w-[245px] max-[700px]:-translate-x-full max-[700px]:[&.is-collapsed]:w-[245px]",
    "max-[700px]:[&.is-open]:visible max-[700px]:[&.is-open]:translate-x-0 max-[700px]:[&.is-open_.sidebar-label]:block",
    "max-[700px]:[&.is-open_.brand]:justify-start max-[700px]:[&.is-open_.nav-item]:justify-start",
    "max-[700px]:[&.is-open_.nav-item]:px-3 max-[700px]:[&.is-open_.workspace-profile]:justify-start",
  ].join(" "),
  "brand": [
    "mb-6 flex min-h-10 items-center gap-3 px-2",
  ].join(" "),
  "nav-group": [
    "mb-2 px-3 text-[10px] font-medium tracking-[1.6px] text-muted",
  ].join(" "),
  "tiny-label": [
    "text-[9px] font-[550] tracking-[1.7px] text-muted",
  ].join(" "),
  "nav-item": [
    "flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-[13px] font-medium text-muted transition-colors",
    "hover:bg-elevated hover:text-foreground [&.is-active]:border-brand/20 [&.is-active]:bg-brand/10 [&.is-active]:text-brand",
  ].join(" "),
  "nav-dot": [
    "w-[5px] h-[5px] rounded-full bg-brand ml-auto",
  ].join(" "),
  "sidebar-bottom": [
    "mt-auto",
  ].join(" "),
  "workspace-profile": [
    "flex items-center gap-2.5 px-0.5 pb-[18px] pt-3 [&_strong]:block [&_strong]:text-xs [&_strong]:font-medium [&_small]:mt-1",
    "[&_small]:block [&_small]:text-[11px] [&_small]:text-muted [&>svg]:ml-auto [&>svg]:text-muted",
  ].join(" "),
  "avatar": [
    "grid place-items-center bg-elevated text-foreground text-[10px] font-semibold w-[31px] h-[31px] [border:1px_solid_var(--border)]",
    "rounded-full shrink-0",
  ].join(" "),
  "top-avatar": [
    "grid place-items-center bg-elevated text-foreground text-[9px] font-semibold w-[27px] h-[27px] [border:1px_solid_var(--border)]",
    "rounded-full shrink-0 max-[700px]:hidden",
  ].join(" "),
  "main-shell": [
    "ml-[222px] min-w-0 transition-[margin-left] duration-200 max-[1250px]:ml-[195px] max-[700px]:ml-0",
  ].join(" "),
  "sidebar-collapsed": [
    "[&_.main-shell]:ml-[76px] max-[700px]:[&_.main-shell]:ml-0",
  ].join(" "),
  "topbar": [
    "min-h-[66px] pt-0 pr-[34px] pb-0 pl-[34px] [border-bottom:1px_solid_var(--border)] flex items-center gap-5 min-[1600px]:pl-11",
    "min-[1600px]:pr-11 max-[1250px]:pl-6 max-[1250px]:pr-6 max-[700px]:pt-0 max-[700px]:pr-[18px] max-[700px]:pb-0",
    "max-[700px]:pl-[18px] max-[700px]:min-h-[57px] max-[700px]:gap-[10px] max-[700px]:[&_.connection]:text-[9px]",
  ].join(" "),
  "breadcrumb": [
    "text-[13px] text-muted [&_span]:text-muted [&_span]:pt-0 [&_span]:pr-[13px] [&_span]:pb-0 [&_span]:pl-[13px] [&_b]:font-[450]",
    "[&_b]:text-foreground max-[700px]:text-[10px] max-[700px]:[&_span]:pl-[6px] max-[700px]:[&_span]:pr-[6px]",
  ].join(" "),
  "connection": [
    "flex items-center gap-[7px] text-muted text-[12px] ml-auto [&_i]:w-[5px] [&_i]:h-[5px] [&_i]:bg-[#8ec5ac] [&_i]:rounded-full",
    "[&.warning_i]:bg-[#d6b887] [&:not(.warning)]:text-success [&:not(.warning)_i]:bg-success max-[700px]:text-[9px]!",
  ].join(" "),
  "page-header": [
    "flex items-center justify-between gap-5 pt-[34px] pr-[34px] pb-[25px] pl-[34px] [&_p]:mt-[9px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0",
    "[&_p]:text-[14px] [&_p]:text-muted [&_p]:leading-[1.65] min-[1600px]:pl-11 min-[1600px]:pr-11 max-[1250px]:pl-6 max-[1250px]:pr-6",
    "max-[700px]:pt-[26px] max-[700px]:pr-[18px] max-[700px]:pb-[21px] max-[700px]:pl-[18px] max-[700px]:items-start",
    "max-[700px]:[&_p]:max-w-55 max-[700px]:[&_p]:text-[13px] max-[700px]:[&_p]:leading-[1.6]",
  ].join(" "),
  "eyebrow": [
    "text-[10px] text-muted tracking-[1.6px] font-medium mb-[7px] max-[700px]:text-[8px] max-[700px]:tracking-[1.3px]",
  ].join(" "),
  "refresh-group": [
    "flex items-end flex-col gap-[10px] [&_>_span]:text-[12px] [&_>_span]:text-muted max-[700px]:[&_>_span]:max-w-[125px]",
    "max-[700px]:[&_>_span]:text-[10px] max-[700px]:[&_>_span]:text-right max-[700px]:[&_>_span]:leading-[1.5]",
    "max-[700px]:[&_.button]:text-[11px] max-[700px]:[&_.button]:pt-2 max-[700px]:[&_.button]:pr-2 max-[700px]:[&_.button]:pb-2",
    "max-[700px]:[&_.button]:pl-2",
  ].join(" "),
  "button": [
    "inline-flex min-h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-[5px] border border-border bg-elevated",
    "px-[13px] py-[9px] text-xs font-medium text-foreground hover:enabled:border-border-hover [&.primary]:border-brand",
    "[&.primary]:bg-brand [&.primary]:font-semibold [&.primary]:text-[#241219] [&.primary:hover:enabled]:bg-[#ff8a9c]",
  ].join(" "),
  "text-button": [
    "inline-flex items-center gap-[6px] text-[12px] text-muted pt-2 pr-2 pb-2 pl-2 whitespace-nowrap min-h-[38px]",
    "[&:hover:not(:disabled)]:text-foreground",
  ].join(" "),
  "icon-button": [
    "inline-grid size-[31px] shrink-0 place-items-center rounded-[5px] text-muted hover:enabled:bg-elevated",
    "hover:enabled:text-foreground",
  ].join(" "),
  "dashboard-main": [
    "pt-0 pr-[34px] pb-0 pl-[34px] max-w-445 mt-0 mr-[auto] mb-0 ml-auto min-[1600px]:pl-11 min-[1600px]:pr-11 max-[1250px]:pl-6",
    "max-[1250px]:pr-6 max-[700px]:pl-4 max-[700px]:pr-4",
  ].join(" "),
  "filter-bar": [
    "flex gap-3 items-center flex-wrap pt-[14px] pr-[14px] pb-[14px] pl-[14px] bg-surface-subtle [border:1px_solid_var(--border)]",
    "rounded-[7px] max-[700px]:pt-3 max-[700px]:pr-3 max-[700px]:pb-3 max-[700px]:pl-3 max-[700px]:gap-[9px]",
  ].join(" "),
  "filter-title": [
    "flex items-center gap-2 text-foreground text-[13px] pr-3 [border-right:1px_solid_var(--border)] max-[700px]:hidden",
  ].join(" "),
  "filter-field": [
    "flex items-center gap-2 [border:1px_solid_var(--border)] rounded-[6px] pt-0 pr-3 pb-0 pl-3 bg-elevated min-h-[39px]",
    "text-foreground [transition:border-color_160ms_ease,_box-shadow_160ms_ease,_background-color_160ms_ease]",
    "[&_select]:[appearance:auto] [&_select]:text-foreground [&_select]:[border:0] [&_select]:bg-transparent [&_select]:pt-[7px]",
    "[&_select]:pr-0 [&_select]:pb-[7px] [&_select]:pl-0 [&_select]:text-[13px] [&_select]:max-w-[190px] max-[700px]:[flex:1_1_42%]",
    "max-[700px]:min-w-0 max-[700px]:[&_select]:w-full max-[700px]:[&_select]:text-[12px] max-[700px]:[&_select]:max-w-full",
    "[&:focus-within]:border-[#f8738780] [&:focus-within]:[box-shadow:0_0_0_3px_var(--focus-ring)] [&_select:focus]:[outline:none]",
    "[&_select:focus]:[box-shadow:none] [&_select:focus-visible]:[outline:none] [&_select:focus-visible]:[box-shadow:none]",
  ].join(" "),
  "filter-prefix": [
    "text-[12px] text-muted max-[1250px]:hidden max-[1150px]:hidden",
  ].join(" "),
  "filter-actions": [
    "ml-auto flex items-center gap-2 max-[700px]:w-full max-[700px]:justify-end max-[700px]:[&_.primary]:[flex:1]",
    "max-[700px]:[&_.primary]:max-w-45",
  ].join(" "),
  "custom-dates": [
    "flex items-center gap-2 [&_input]:bg-elevated [&_input]:[border:1px_solid_var(--border)] [&_input]:pt-[6px] [&_input]:pr-[6px]",
    "[&_input]:pb-[6px] [&_input]:pl-[6px] [&_input]:rounded-[4px] [&_input]:text-[13px] [&_input]:min-w-0 max-[700px]:w-full",
    "max-[700px]:[&_input]:w-[45%] [&_input:focus-visible]:[outline:none] [&_input:focus-visible]:border-[#f8738780]",
    "[&_input:focus-visible]:[box-shadow:0_0_0_3px_var(--focus-ring)]",
  ].join(" "),
  "unsaved-dot": [
    "w-[5px] h-[5px] bg-brand rounded-full",
  ].join(" "),
  "filter-error": [
    "[flex-basis:100%] text-brand text-[11px]",
  ].join(" "),
  "scope-note": [
    "flex items-start gap-[6px] text-muted text-[12px] mt-3 mr-[2px] mb-[25px] ml-[2px] leading-[1.65] [&_svg]:mt-[2px]",
    "[&_svg]:shrink-0 max-[700px]:text-[11px] max-[700px]:mb-[22px]",
  ].join(" "),
  "section-label": [
    "flex justify-between items-center mb-3 [&_h2]:text-[15px] [&_h2]:font-[550] [&_h2]:text-foreground [&_>_span]:text-[12px]",
    "[&_>_span]:text-muted [&_>_span]:flex [&_>_span]:gap-[6px] [&_>_span]:items-center max-[700px]:items-start max-[700px]:gap-3",
    "max-[700px]:[&_h2]:text-[14px] max-[700px]:[&_>_span]:text-[11px] max-[700px]:[&_>_span]:whitespace-nowrap",
  ].join(" "),
  "legend-dot": [
    "inline-block w-[6px] h-[6px] rounded-full bg-muted shrink-0",
  ].join(" "),
  "metric-grid": [
    "grid grid-cols-5 gap-[9px] mb-[22px] max-[1150px]:grid-cols-[repeat(5,minmax(175px,1fr))] max-[1150px]:overflow-x-auto",
    "max-[1150px]:pb-[5px] [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]",
  ].join(" "),
  "metric-card": [
    "bg-surface border border-border rounded-[7px] min-w-0 px-3 pt-[11px] pb-[10px] transition-colors hover:border-border-hover",
    "hover:bg-surface-hover",
  ].join(" "),
  "metric-accent": [
    "[border-top-color:#f8738770] [&_.metric-heading_svg]:text-brand",
  ].join(" "),
  "metric-heading": [
    "flex justify-between items-start gap-[7px] text-muted text-xs leading-[1.4] min-h-[18px] max-[700px]:min-h-8 [&_svg]:size-[15px]",
    "[&_svg]:shrink-0 [&_svg]:text-muted",
  ].join(" "),
  "metric-value": [
    "block mt-[6px] text-[26px] font-[550] leading-[1.2] tracking-[-.65px] tabular-nums max-[700px]:mt-px",
  ].join(" "),
  "metric-note": [
    "flex justify-between items-center gap-1 text-muted text-[10px] leading-[1.4] mt-1 min-h-[14px]",
  ].join(" "),
  "info-tip": [
    "relative cursor-help shrink-0 [&_>_span]:hidden [&_>_span]:absolute [&_>_span]:bottom-[23px] [&_>_span]:right-[-5px]",
    "[&_>_span]:z-[20] [&_>_span]:w-[250px] [&_>_span]:[border:1px_solid_var(--border)] [&_>_span]:bg-elevated",
    "[&_>_span]:text-foreground [&_>_span]:pt-[11px] [&_>_span]:pr-[11px] [&_>_span]:pb-[11px] [&_>_span]:pl-[11px]",
    "[&_>_span]:rounded-[6px] [&_>_span]:text-[12px] [&_>_span]:leading-[1.6] [&_>_span]:[box-shadow:0_8px_24px_#0004]",
    "[&:hover_>_span]:block [&:focus_>_span]:block max-[700px]:[&_>_span]:w-[190px]",
  ].join(" "),
  "analytics-grid": [
    "mb-5 grid grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] gap-[18px] max-[1250px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
    "max-[960px]:grid-cols-1 max-[700px]:gap-[15px]",
  ].join(" "),
  "panel": [
    "bg-surface [border:1px_solid_var(--border)] rounded-[7px] min-w-0 overflow-hidden [&_h2]:text-[16px] [&_h2]:font-[550]",
    "[&_h2]:tracking-[-.3px] [&_h2]:mt-0 [&_h2]:mr-0 [&_h2]:mb-0 [&_h2]:ml-0 max-[700px]:[&_h2]:text-[15px]",
  ].join(" "),
  "panel-heading": [
    "flex items-start justify-between gap-[14px] pt-[23px] pr-6 pb-[13px] pl-6 [&_p]:text-muted [&_p]:text-[12px] [&_p]:mt-[6px]",
    "[&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:leading-[1.6] max-[960px]:pl-[17px] max-[960px]:pr-[17px] max-[960px]:gap-2",
    "max-[700px]:pt-5 max-[700px]:pr-[17px] max-[700px]:pb-3 max-[700px]:pl-[17px] max-[700px]:[&_p]:text-[12px]",
  ].join(" "),
  "tag": [
    "inline-flex items-center gap-[6px] whitespace-nowrap text-[11px] text-foreground [border:1px_solid_var(--border)] rounded-[4px]",
    "pt-[6px] pr-2 pb-[6px] pl-2",
  ].join(" "),
  "chart-legend": [
    "flex items-center gap-[6px] text-foreground text-[12px] pt-[3px] whitespace-nowrap [&_i]:bg-brand [&_i]:w-[6px] [&_i]:h-[6px]",
    "[&_i]:rounded-full [&.secondary_i]:bg-[var(--chart-order)] max-[1250px]:text-[9px] max-[960px]:hidden max-[700px]:flex",
    "max-[700px]:text-[10px]",
  ].join(" "),
  "chart-summary": [
    "pt-[2px] pr-6 pb-0 pl-6 flex items-center gap-[9px] min-h-13 [&_>_strong]:text-[32px] [&_>_strong]:font-[550]",
    "[&_>_strong]:tracking-[-.8px] [&_>_span:not(.tag)]:text-muted [&_>_span:not(.tag)]:text-[12px] max-[960px]:[&_>_.tag]:hidden",
    "max-[960px]:pl-[17px] max-[960px]:pr-[17px] max-[700px]:pl-[17px] max-[700px]:pr-[17px]",
    "max-[700px]:[&_>_span:not(.tag)]:text-[11px]",
  ].join(" "),
  "chart-container": [
    "h-[265px] w-full pt-[10px] pr-5 pb-5 pl-5 min-[1600px]:h-[245px] max-[700px]:h-60 max-[700px]:pl-2 max-[700px]:pr-2",
  ].join(" "),
  "panel-footnote": [
    "pt-[11px] pr-[22px] pb-[11px] pl-[22px] [border-top:1px_solid_var(--border)] text-[11px] text-muted leading-[1.7] flex flex-wrap",
    "gap-[8px_16px] max-[700px]:pl-[18px] max-[700px]:pr-[18px]",
  ].join(" "),
  "status-content": [
    "min-h-[321px] pt-[18px] pr-[22px] pb-[17px] pl-[22px] min-[1600px]:min-h-[290px] max-[700px]:flex max-[700px]:items-center",
    "max-[700px]:min-h-55 max-[700px]:gap-[10px] max-[700px]:pt-0 max-[700px]:pr-[18px] max-[700px]:pb-3 max-[700px]:pl-[18px]",
  ].join(" "),
  "donut-container": [
    "h-[185px] w-full relative max-[700px]:w-[50%] max-[700px]:shrink-0",
  ].join(" "),
  "donut-label": [
    "absolute top-[50%] left-[50%] [transform:translate(-50%,_-50%)] flex flex-col items-center pointer-events-none",
    "[&_strong]:text-[31px] [&_strong]:font-medium [&_span]:text-[12px] [&_span]:text-muted",
  ].join(" "),
  "status-legend": [
    "grid gap-3 max-h-[115px] overflow-auto [&_>_div]:flex [&_>_div]:items-center [&_>_div]:gap-2 [&_>_div]:text-[12px]",
    "[&_>_div_>_span:nth-child(2)]:[overflow-wrap:anywhere] [&_>_div_>_span:nth-child(2)]:text-foreground [&_strong]:ml-auto",
    "[&_strong]:font-medium [&_small]:w-8 [&_small]:text-right [&_small]:text-muted [&_small]:text-[11px] max-[700px]:[flex:1]",
    "max-[700px]:max-h-50 max-[700px]:[&_>_div]:text-[11px]",
  ].join(" "),
  "activity-list": [
    "pt-[6px] pr-[22px] pb-[6px] pl-[22px]",
  ].join(" "),
  "activity-row": [
    "flex items-center gap-3 pt-[15px] pr-0 pb-[15px] pl-0 [&_+_.activity-row]:[border-top:1px_solid_var(--border)] [&_strong]:block",
    "[&_strong]:text-[13px] [&_strong]:font-medium [&_small]:block [&_small]:text-muted [&_small]:text-[11px] [&_small]:mt-[5px]",
    "[&_b]:text-[27px] [&_b]:font-medium [&_b]:ml-auto",
  ].join(" "),
  "activity-icon": [
    "w-[37px] h-[37px] rounded-[7px] bg-elevated text-foreground grid place-items-center shrink-0 [&.wishlist]:bg-[#f873870c]",
    "[&.wishlist]:text-[#d893a1] [&.cart]:text-success [&.cart]:bg-[color-mix(in_srgb,_var(--success)_11%,_transparent)]",
  ].join(" "),
  "data-note": [
    "mt-2 mr-[22px] mb-5 ml-[22px] flex gap-[9px] pt-[13px] pr-3 pb-[13px] pl-3 bg-surface-subtle [border:1px_solid_var(--border)]",
    "rounded-[5px] [&_>_svg]:text-success [&_>_svg]:shrink-0 [&_>_svg]:mt-[2px] [&_strong]:text-[12px] [&_strong]:text-foreground",
    "[&_strong]:font-medium [&_p]:text-[12px] [&_p]:leading-[1.7] [&_p]:text-muted [&_p]:mt-1 [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0",
  ].join(" "),
  "muted": [
    "text-muted",
  ].join(" "),
  "recent-panel": [
    "[&_.panel-heading]:pb-5",
  ].join(" "),
  "table-scroll": [
    "overflow-x-auto",
  ].join(" "),
  "customer-cell": [
    "flex items-center gap-[10px] [&_strong]:block [&_strong]:text-foreground [&_strong]:text-[13px] [&_strong]:font-medium",
    "[&_small]:block [&_small]:text-muted [&_small]:mt-1 [&_small]:text-[12px]",
  ].join(" "),
  "customer-avatar": [
    "grid place-items-center h-[35px] w-[35px] rounded-full bg-elevated text-foreground text-[12px]",
  ].join(" "),
  "record-id": [
    "[font-family:var(--font-geist-mono),_monospace] text-[12px]",
  ].join(" "),
  "status-badge": [
    "inline-flex gap-[6px] items-center bg-[#b6a3820b] [border:1px_solid_#b6a38225] text-[#baad92] rounded-[4px] pt-1 pr-[7px] pb-1",
    "pl-[7px] text-[11px] [&_i]:w-1 [&_i]:h-1 [&_i]:bg-current [&_i]:rounded-full [&.verified]:text-[#8cbfa9]",
    "[&.verified]:bg-[#7bad960b] [&.verified]:border-[#7bad9625]",
  ].join(" "),
  "table-footer": [
    "flex justify-between items-center pt-[10px] pr-[22px] pb-[10px] pl-[22px] [border-top:1px_solid_var(--border)] text-[11px]",
    "text-muted [&_>_div]:flex [&_>_div]:items-center [&_>_div]:gap-[11px] max-[700px]:pl-3 max-[700px]:pr-3 max-[700px]:text-[10px]",
    "max-[700px]:[&_>_div]:gap-[5px]",
  ].join(" "),
  "dashboard-footer": [
    "flex justify-between pt-6 pr-0 pb-6 pl-0 text-muted text-[11px] [&_>_span]:flex [&_>_span]:items-center [&_>_span]:gap-[6px]",
    "max-[700px]:flex-wrap max-[700px]:gap-3 max-[700px]:pt-[22px] max-[700px]:pb-[22px]",
  ].join(" "),
  "footer-divider": [
    "pt-0 pr-[3px] pb-0 pl-[3px] text-muted",
  ].join(" "),
  "empty-state": [
    "min-h-65 flex flex-col justify-center items-center text-center pt-7 pr-7 pb-7 pl-7 [&_strong]:text-foreground",
    "[&_strong]:text-[14px] [&_strong]:font-medium [&_p]:max-w-[370px] [&_p]:text-muted [&_p]:text-[12px] [&_p]:leading-[1.7]",
    "[&_p]:mt-[7px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 max-[700px]:min-h-[230px]",
  ].join(" "),
  "empty-icon": [
    "text-muted [border:1px_solid_var(--border)] rounded-[10px] w-[46px] h-[46px] grid place-items-center mb-[15px] bg-elevated",
  ].join(" "),
  "error-banner": [
    "flex gap-[11px] items-start pt-[15px] pr-[15px] pb-[15px] pl-[15px] mb-[22px] bg-[#c6a57408] [border:1px_solid_#c6a57435]",
    "rounded-[6px] text-[#c8b794] [&_>_svg]:shrink-0 [&_>_svg]:mt-[2px] [&_strong]:text-[13px] [&_strong]:font-[550] [&_p]:text-[12px]",
    "[&_p]:leading-[1.7] [&_p]:mt-1 [&_p]:text-[#a99f8e] [&_summary]:text-[12px] [&_summary]:leading-[1.7] [&_summary]:mt-1",
    "[&_summary]:text-[#a99f8e] [&_>_button]:ml-auto",
  ].join(" "),
  "pagination-error": [
    "pt-[10px] pr-[22px] pb-[10px] pl-[22px] text-brand text-[11px]",
  ].join(" "),
  "skeleton": [
    "bg-elevated rounded-[4px]",
  ].join(" "),
  "metric-skeleton": [
    "w-[60%] h-[34px] mt-1 mb-1",
  ].join(" "),
  "chart-skeleton": [
    "h-[210px] mt-[18px] mr-[22px] mb-8 ml-[22px] opacity-[.4]",
  ].join(" "),
  "table-loading": [
    "grid gap-[18px] pt-[15px] pr-[22px] pb-[25px] pl-[22px] [&_>_div]:h-[34px]",
  ].join(" "),
  "small-spinner": [
    "h-[13px] w-[13px] [border:2px_solid_var(--border)] [border-top-color:var(--accent)] rounded-full",
  ].join(" "),
  "skip-link": [
    "fixed -top-[60px] left-2.5 z-[100] rounded-[5px] bg-brand px-[15px] py-2.5 text-[#12121b] focus:top-2.5",
  ].join(" "),
  "mobile-menu": [
    "hidden max-[700px]:inline-grid",
  ].join(" "),
  "mobile-close": [
    "ml-auto hidden max-[700px]:inline-grid",
  ].join(" "),
  "drawer-backdrop": [
    "max-[700px]:fixed max-[700px]:[inset:0] max-[700px]:bg-[#0009] max-[700px]:z-[40]",
  ].join(" "),
  "theme-toggle": [
    "inline-flex h-auto w-auto gap-[7px] rounded-[7px] border border-border px-2.5 py-[7px] [&_span]:whitespace-nowrap [&_span]:text-xs",
    "max-[700px]:w-[33px] max-[700px]:p-[7px] max-[700px]:[&_span]:hidden",
  ].join(" "),
  "refresh-progress": [
    "fixed top-0 left-0 right-0 h-[3px] overflow-hidden bg-border z-[100] [&_span]:block [&_span]:w-[35%] [&_span]:h-full",
    "[&_span]:bg-brand",
  ].join(" "),
  "desktop-sidebar-toggle": [
    "max-[700px]:hidden",
  ].join(" "),
  "comparison-context": [
    "flex items-center flex-wrap gap-2 mt-[-3px] mr-0 mb-[17px] ml-0 text-muted text-[12px] [&_>_span:last-child]:ml-[5px]",
    "[&_>_span:last-child]:text-[11px] max-[700px]:text-[11px] max-[700px]:[&_>_span:last-child]:w-full",
    "max-[700px]:[&_>_span:last-child]:ml-6",
  ].join(" "),
  "comparison-marker": [
    "w-4 [border-top:2px_dashed_var(--muted)]",
  ].join(" "),
  "metric-comparison": [
    "flex items-center flex-wrap gap-[3px_5px] [border-top:1px_solid_var(--border)] pt-2 mt-[7px] text-muted text-[10px] min-h-[27px]",
    "max-[700px]:min-h-[27px] max-[700px]:content-center max-[700px]:gap-[3px] max-[700px]:text-[10px]",
  ].join(" "),
  "change-badge": [
    "inline-flex items-center gap-[2px] text-[10px] font-[550] pt-[2px] pr-[3px] pb-[2px] pl-[3px] rounded-[4px]",
    "[&.positive]:text-success [&.positive]:bg-[color-mix(in_srgb,_var(--success)_9%,_transparent)] [&.negative]:text-brand",
    "[&.negative]:bg-[color-mix(in_srgb,_var(--accent)_8%,_transparent)] [&.neutral]:bg-elevated [&.neutral]:text-muted",
  ].join(" "),
  "snapshot-card-note": [
    "flex items-center gap-[5px] [border-top:1px_solid_var(--border)] pt-[10px] mt-[7px] text-muted text-[10px] leading-[1.4]",
  ].join(" "),
  "snapshot-dot": [
    "w-[5px] h-[5px] rounded-full bg-success",
  ].join(" "),
  "previous-legend": [
    "inline-flex items-center gap-[6px] [&_i]:w-[14px] [&_i]:[border-top:2px_dashed_var(--muted)]",
  ].join(" "),
  "orders-panel": [
    "col-span-full [&_.chart-container]:h-[245px] max-[700px]:[&_.chart-container]:h-60",
  ].join(" "),
  "snapshot-section": [
    "mb-5 [&_.panel]:grid [&_.panel]:grid-cols-[1.25fr_1fr] [&_.panel-heading]:col-span-full [&_.activity-list]:flex",
    "[&_.activity-list]:gap-7 [&_.activity-list]:items-center [&_.activity-list]:pb-5 [&_.activity-row]:[flex:1]",
    "[&_.activity-row]:gap-[10px] [&_.activity-row]:[border:0] max-[1150px]:[&_.panel]:grid-cols-[1fr]",
    "max-[1150px]:[&_.activity-list]:pb-0 max-[1150px]:[&_.data-note]:mt-[5px] max-[700px]:[&_.activity-list]:block",
    "max-[700px]:[&_.activity-row_+_.activity-row]:[border-top:1px_solid_var(--border)] max-[700px]:[&_.panel-heading]:flex-wrap",
    "max-[700px]:[&_.data-note]:mt-3",
  ].join(" "),
  "snapshot-tag": [
    "text-success border-[color-mix(in_srgb,_var(--success)_25%,_var(--border))]",
  ].join(" "),
  "orders-toolbar": [
    "flex items-center flex-wrap gap-[10px] mb-4 max-[700px]:[&_.filter-field]:[flex-basis:40%]",
  ].join(" "),
  "order-search": [
    "flex items-center gap-[10px] [flex:1_1_260px] min-w-0 [border:1px_solid_var(--border)] rounded-[7px] bg-surface pt-[10px] pr-3",
    "pb-[10px] pl-3 text-muted [&:focus-within]:border-brand [&:focus-within]:[box-shadow:0_0_0_3px_var(--focus-ring)] [&_input]:w-full",
    "[&_input]:min-w-0 [&_input]:[outline:none] [&_input]:bg-transparent [&_input]:text-foreground [&_input]:text-[13px]",
  ].join(" "),
  "order-data-note": [
    "flex gap-[9px] items-start text-muted text-[12px] leading-[1.7] mt-3 mr-0 mb-[18px] ml-0 [&_svg]:shrink-0 [&_svg]:mt-[3px]",
    "[&_svg]:text-success",
  ].join(" "),
  "orders-bottom-note": [
    "flex gap-[9px] items-start text-muted text-[12px] leading-[1.7] mt-3 mr-0 mb-[18px] ml-0 [&_svg]:shrink-0 [&_svg]:mt-[3px]",
    "[&_svg]:text-success",
  ].join(" "),
  "orders-list-title": [
    "flex items-center gap-[10px] [&_>_svg]:text-muted [&_h2]:text-[15px] [&_.tag]:[border:0] [&_.tag]:bg-elevated [&_.tag]:pt-[3px]",
    "[&_.tag]:pr-[7px] [&_.tag]:pb-[3px] [&_.tag]:pl-[7px] [&_.tag]:rounded-[4px] [&_.tag]:text-[11px]",
  ].join(" "),
  "orders-sort": [
    "text-muted text-[11px] whitespace-nowrap max-[700px]:hidden",
  ].join(" "),
  "orders-panel-table": [
    "[&_.panel-heading]:items-center [&_.panel-heading]:pb-5 min-w-0 overflow-hidden [&_.table-scroll]:relative",
    "[&_.table-scroll]:w-full [&_.table-scroll]:overflow-x-auto max-[700px]:[&_.table-footer]:flex-wrap",
    "max-[700px]:[&_.table-footer]:gap-3",
  ].join(" "),
  "orders-table": [
    "w-full min-w-[890px] [&_td]:pt-4 [&_td]:pr-[clamp(12px,_1.2vw,_20px)] [&_td]:pb-4 [&_td]:pl-[clamp(12px,_1.2vw,_20px)]",
    "[&_td]:[vertical-align:middle] [&_td]:text-foreground [&_td]:text-[12px] [&_th]:pl-[clamp(12px,_1.2vw,_20px)]",
    "[&_th]:pr-[clamp(12px,_1.2vw,_20px)] [&_th]:text-[11px] [&_th]:font-medium [&_th]:normal-case [&_th]:tracking-[0]",
    "[&_th]:text-muted [&_th]:bg-surface [&_th]:pt-3 [&_th]:pb-3 [&_small]:block [&_small]:text-muted [&_small]:text-[11px]",
    "[&_small]:mt-[5px] [&_small]:leading-[1.5] [&_tbody_tr:hover]:bg-[color-mix(in_srgb,_var(--foreground)_2%,_var(--surface))]",
    "[&_.order-amount]:font-medium [&_.order-amount]:text-right [&_.order-amount_small]:font-normal [&_.order-amount_small]:text-[10px]",
    "[&_th.price-heading]:text-right [&_.order-customer]:font-medium [&_.order-customer]:text-[13px]",
  ].join(" "),
  "order-reference": [
    "text-foreground text-[13px] font-semibold cursor-pointer [&:hover]:text-brand [&:hover]:[text-decoration:underline]",
    "[&:hover]:[text-underline-offset:4px]",
  ].join(" "),
  "order-customer": [
    "font-medium",
  ].join(" "),
  "order-location": [
    "max-w-[155px]",
  ].join(" "),
  "order-amount": [
    "tabular-nums whitespace-nowrap",
  ].join(" "),
  "not-recorded": [
    "text-[11px] text-muted",
  ].join(" "),
  "order-status": [
    "inline-flex items-center gap-[7px] text-foreground text-[12px] font-[550] whitespace-nowrap leading-[1.6] [&_svg]:shrink-0",
    "[&.success]:text-[#72d3a5] [&.pending]:text-[#e6bb70] [&.attention]:text-[#f19491] [&.transit]:text-[#8fb9ef]",
    "[&.neutral]:text-muted",
  ].join(" "),
  "page-size-label": [
    "flex items-center gap-[7px] [&_select]:pt-[5px] [&_select]:pr-[5px] [&_select]:pb-[5px] [&_select]:pl-[5px]",
    "[&_select]:[border:1px_solid_var(--border)] [&_select]:bg-surface [&_select]:rounded-[5px] [&_select]:text-foreground",
  ].join(" "),
  "order-modal-backdrop": [
    "fixed [inset:0] z-[110] bg-[#09090baa] flex justify-end",
  ].join(" "),
  "order-details": [
    "w-[min(560px,_100%)] h-full flex flex-col bg-surface [border-left:1px_solid_var(--border)] [box-shadow:-16px_0_60px_#0002]",
    "[&_>_header]:flex [&_>_header]:justify-between [&_>_header]:items-start [&_>_header]:pt-6 [&_>_header]:pr-6 [&_>_header]:pb-6",
    "[&_>_header]:pl-6 [&_>_header]:[border-bottom:1px_solid_var(--border)] [&_h2]:text-[24px] [&_h2]:mt-2 [&_h2]:mr-0 [&_h2]:mb-2",
    "[&_h2]:ml-0 [&_header_p]:text-muted [&_header_p]:text-[12px] [&_footer]:text-muted [&_footer]:text-[12px] [&_footer]:mt-auto",
    "[&_footer]:pt-[18px] [&_footer]:pr-6 [&_footer]:pb-[18px] [&_footer]:pl-6 [&_footer]:[border-top:1px_solid_var(--border)]",
  ].join(" "),
  "order-detail-content": [
    "pt-6 pr-6 pb-6 pl-6 overflow-y-auto max-[700px]:pt-5 max-[700px]:pr-5 max-[700px]:pb-5 max-[700px]:pl-5",
  ].join(" "),
  "order-facts": [
    "grid grid-cols-[1fr_1fr] gap-[22px_18px] mt-0 mr-0 mb-0 ml-0 [&_dt]:text-[11px] [&_dt]:text-muted [&_dt]:mb-[6px] [&_dd]:mt-0",
    "[&_dd]:mr-0 [&_dd]:mb-0 [&_dd]:ml-0 [&_dd]:text-[13px] [&_dd]:[overflow-wrap:anywhere] [&_dd]:leading-[1.6] [&_small]:block",
    "[&_small]:text-muted [&_small]:text-[11px]",
  ].join(" "),
  "order-products": [
    "[&_small]:block [&_small]:text-muted [&_small]:text-[11px] [list-style:none] pt-0 pr-0 pb-0 pl-0 [&_li]:flex [&_li]:items-start",
    "[&_li]:gap-3 [&_li]:pt-3 [&_li]:pr-0 [&_li]:pb-3 [&_li]:pl-0 [&_li]:text-[12px] [&_li_>_div]:[flex:1] [&_strong]:font-medium",
    "[&_strong]:leading-[1.6]",
  ].join(" "),
  "order-id-fact": [
    "col-span-full",
  ].join(" "),
  "detail-section": [
    "mt-[26px] pt-[22px] [border-top:1px_solid_var(--border)] [&_h3]:flex [&_h3]:gap-[9px] [&_h3]:items-center [&_h3]:text-[14px]",
    "[&_h3]:mt-0 [&_h3]:mr-0 [&_h3]:mb-5 [&_h3]:ml-0 [&_h3_span]:ml-auto [&_h3_span]:text-muted [&_h3_span]:text-[11px]",
    "[&_h3_span]:font-normal",
  ].join(" "),
  "product-icon": [
    "pt-[10px] pr-[10px] pb-[10px] pl-[10px] bg-elevated rounded-[6px] text-muted",
  ].join(" "),
  "order-field-note": [
    "text-[12px] text-muted leading-[1.7]",
  ].join(" "),
  "delivery-issue": [
    "text-[12px] text-[var(--chart-pending)] leading-[1.7]",
  ].join(" "),
  "tracking-events": [
    "mt-[22px] text-[12px] [&_h4]:mb-[18px] [&_h4]:font-medium [&_>_div]:relative [&_>_div]:pt-0 [&_>_div]:pr-0 [&_>_div]:pb-[22px]",
    "[&_>_div]:pl-[18px] [&_>_div]:[border-left:1px_solid_var(--border)] [&_>_div]:ml-1 [&_i]:absolute [&_i]:left--1 [&_i]:top-1",
    "[&_i]:w-[7px] [&_i]:h-[7px] [&_i]:rounded-full [&_i]:bg-success [&_strong]:font-medium [&_time]:block [&_time]:text-muted",
    "[&_time]:mt-[5px] [&_small]:block [&_small]:text-muted [&_small]:mt-[5px]",
  ].join(" "),
  "order-row-actions": [
    "flex items-center gap-[3px] [&_.icon-button]:w-[30px] [&_.icon-button]:h-8",
  ].join(" "),
  "order-action-menu": [
    "fixed z-[90] w-[205px] pt-[5px] pr-[5px] pb-[5px] pl-[5px] bg-surface [border:1px_solid_var(--border)]",
    "rounded-[var(--radius-dialog)] [box-shadow:0_12px_35px_#0003] [&_button]:flex [&_button]:items-center [&_button]:gap-[10px]",
    "[&_button]:text-left [&_button]:w-full [&_button]:pt-[11px] [&_button]:pr-[10px] [&_button]:pb-[11px] [&_button]:pl-[10px]",
    "[&_button]:text-[12px] [&_button]:text-foreground [&_button]:rounded-[5px] [&_button]:cursor-pointer [&_button:hover]:bg-elevated",
    "[&_button_svg]:text-muted [&_p]:text-brand [&_p]:text-[11px] [&_p]:pt-2 [&_p]:pr-2 [&_p]:pb-2 [&_p]:pl-2",
  ].join(" "),
  "status-editor": [
    "fixed [inset:0] mt-auto mr-[auto] mb-[auto] ml-auto w-[min(450px,_calc(100%_-_32px))] max-h-[calc(100dvh_-_32px)] overflow-y-auto",
    "text-foreground bg-surface [border:1px_solid_var(--border)] rounded-[var(--radius-dialog)] pt-6 pr-6 pb-6 pl-6",
    "[box-shadow:0_24px_80px_#0004] [&::backdrop]:bg-[#09090b99] [&_header]:flex [&_header]:items-start [&_header]:justify-between",
    "[&_h2]:text-[22px] [&_h2]:font-[550] [&_h2]:mt-2 [&_h2]:mr-0 [&_h2]:mb-0 [&_h2]:ml-0 [&_h2]:tracking-[-.6px] [&_footer]:flex",
    "[&_footer]:justify-between [&_footer]:gap-3 [&_footer]:pt-5 [&_footer]:[border-top:1px_solid_var(--border)]",
  ].join(" "),
  "order-calendar": [
    "fixed [inset:0] mt-auto mr-[auto] mb-[auto] ml-auto w-[min(380px,_calc(100%_-_32px))] max-h-[calc(100dvh_-_32px)] overflow-y-auto",
    "text-foreground bg-surface [border:1px_solid_var(--border)] rounded-[var(--radius-dialog)] pt-6 pr-6 pb-6 pl-6",
    "[box-shadow:0_24px_80px_#0004] [&::backdrop]:bg-[#09090b99] [&_header]:flex [&_header]:items-start [&_header]:justify-between",
    "[&_h2]:text-[22px] [&_h2]:font-[550] [&_h2]:mt-2 [&_h2]:mr-0 [&_h2]:mb-0 [&_h2]:ml-0 [&_h2]:tracking-[-.6px] [&_footer]:flex",
    "[&_footer]:justify-between [&_footer]:gap-3 [&_footer]:pt-5 [&_footer]:[border-top:1px_solid_var(--border)]",
  ].join(" "),
  "editor-intro": [
    "text-[12px] text-muted leading-[1.7] mt-4 mr-0 mb-4 ml-0",
  ].join(" "),
  "editor-help": [
    "text-[12px] text-muted leading-[1.7] mt-4 mr-0 mb-4 ml-0",
  ].join(" "),
  "calendar-hint": [
    "text-[12px] text-muted leading-[1.7] mt-4 mr-0 mb-4 ml-0",
  ].join(" "),
  "editor-fields": [
    "grid gap-[18px] mt-6 mr-0 mb-6 ml-0 [&_label]:grid [&_label]:gap-2 [&_label]:text-muted [&_label]:text-[12px] [&_input]:min-w-0",
    "[&_input]:w-full [&_input]:bg-elevated [&_input]:[border:1px_solid_var(--border)] [&_input]:text-foreground",
    "[&_input]:rounded-[var(--radius-control)] [&_input]:pt-[11px] [&_input]:pr-3 [&_input]:pb-[11px] [&_input]:pl-3",
    "[&_input]:text-[13px] [&_input]:[outline:none] [&_input:focus]:border-brand",
    "[&_input:focus]:[box-shadow:0_0_0_3px_var(--focus-ring)]",
  ].join(" "),
  "calendar-inputs": [
    "[&_label]:grid [&_label]:gap-2 [&_label]:text-muted [&_label]:text-[12px] [&_input]:min-w-0 [&_input]:w-full [&_input]:bg-elevated",
    "[&_input]:[border:1px_solid_var(--border)] [&_input]:text-foreground [&_input]:rounded-[var(--radius-control)] [&_input]:pt-[9px]",
    "[&_input]:pr-[9px] [&_input]:pb-[9px] [&_input]:pl-[9px] [&_input]:text-[12px] [&_input]:[outline:none]",
    "[&_input:focus]:border-brand [&_input:focus]:[box-shadow:0_0_0_3px_var(--focus-ring)] grid grid-cols-[1fr_1fr] gap-3 mt-[22px]",
    "mr-0 mb-4 ml-0",
  ].join(" "),
  "editor-error": [
    "text-[12px] text-brand leading-[1.6] pt-3 pr-0 pb-3 pl-0",
  ].join(" "),
  "order-save-success": [
    "flex gap-3 items-start pt-6 pr-0 pb-6 pl-0 text-success [&_strong]:text-[15px] [&_strong]:font-[550] [&_p]:text-[12px]",
    "[&_p]:text-muted [&_p]:mt-[6px]",
  ].join(" "),
  "order-date-trigger": [
    "whitespace-nowrap [&.has-date]:text-brand [&.has-date]:border-[color-mix(in_srgb,_var(--accent)_40%,_var(--border))]",
  ].join(" "),
  "calendar-month": [
    "flex items-center justify-between mt-3 mr-0 mb-3 ml-0 [&_strong]:text-[13px] [&_strong]:font-medium",
  ].join(" "),
  "calendar-grid": [
    "grid grid-cols-[repeat(7,_1fr)] gap-[3px] [&_>_*]:grid [&_>_*]:place-items-center [&_>_*]:[aspect-ratio:1] [&_>_*]:text-[12px]",
    "[&_>_*]:rounded-[var(--radius-control)] [&_button]:cursor-pointer [&_button]:[border:1px_solid_transparent]",
    "[&_button:hover]:bg-elevated [&_button:hover]:border-border [&_button.is-today]:[text-decoration:underline]",
    "[&_button.is-today]:[text-underline-offset:5px] [&_button.in-range]:bg-[color-mix(in_srgb,_var(--accent)_9%,_transparent)]",
    "[&_button.in-range]:text-brand [&_button.selected]:bg-brand [&_button.selected]:text-[#231018] [&_button.selected]:font-semibold",
  ].join(" "),
  "calendar-weekday": [
    "text-muted text-[10px]!",
  ].join(" "),
};

export function ui(...values) {
  const names = values.filter(Boolean).join(" ").split(/\s+/).filter(Boolean);
  return twMerge(names.map(name => styles[name] ? name + " " + styles[name] : name).join(" "));
}
