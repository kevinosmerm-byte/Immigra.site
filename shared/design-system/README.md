# Shared Liquid Glass system

Use GlassCard, GlassSection, GlassToggle and GlassAccordion from Glass.jsx for surfaces and controls. Inicio, Perfil, Ayuda Migratoria, Configuracion and Mi cuenta use this same material.

liquid-glass.css is the source of truth for material, border, radius, shadow, hover, focus, dark mode, reduced transparency and reduced motion. Change --liquid-* tokens there to update all consumers. Page styles should define layout and spacing, not duplicate background, blur, shadow or theme values. Existing --entry-glass-* names are compatibility aliases.

Keep real button, link, label and details semantics. GlassCard accepts an `as` prop; do not add click handlers to non-interactive containers. Controls must use the actual stored preference or account state. Never use visual-reference amounts as account data.

Check light/dark, reduced transparency, mobile overflow and keyboard focus after shared edits. Preserve authentication, official links, legal content, progress and account operations.
