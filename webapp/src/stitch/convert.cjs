const fs = require('fs');
const path = require('path');

function htmlToJsx(html) {
    let jsx = html;
    // Basic class -> className
    jsx = jsx.replace(/class=/g, 'className=');
    // Basic for -> htmlFor
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    // Close unclosed inputs
    jsx = jsx.replace(/<input([^>]*[^\/])>/g, '<input$1 />');
    // Close unclosed imgs
    jsx = jsx.replace(/<img([^>]*[^\/])>/g, '<img$1 />');
    // Convert inline styles.
    jsx = jsx.replace(/style=\"([^\"]+)\"/g, (match, p1) => {
        let styles = p1.split(';').filter(s => s.trim() !== '');
        let styleObj = styles.map(s => {
            let [k, v] = s.split(':');
            if(!v) return '';
            k = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
            return `${k}: '${v.trim()}'`;
        }).filter(s => s).join(', ');
        return `style={{${styleObj}}}`;
    });
    // Convert SVG attributes
    jsx = jsx.replace(/viewbox=/g, 'viewBox=');
    jsx = jsx.replace(/stroke-dasharray=/g, 'strokeDasharray=');
    jsx = jsx.replace(/stroke-width=/g, 'strokeWidth=');
    
    // Extract the body content
    const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) return jsx;
    let content = bodyMatch[1];
    
    // remove scripts from content if any
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // replace HTML comments with JSX comments
    content = content.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
    
    // Remove markdown code block markers usually found at the end
    content = content.replace(/```\s*$/g, '');

    return `import React from 'react';\n\nexport function Component({ onViewSwitch }) {\n  return (\n    <>\n      ${content}\n    </>\n  );\n}`;
}

const screen1Html = fs.readFileSync('webapp/src/stitch/screen1.html', 'utf8');
const screen1Jsx = htmlToJsx(screen1Html)
    .replace('export function Component({ onViewSwitch })', 'export function EnterpriseDashboard({ onViewSwitch })')
    .replace('<!-- Sidebar Navigation -->', '<div className="w-full h-full text-slate-900 dark:text-slate-100 font-display min-h-screen flex overflow-hidden">')
    .replace('</footer>\n</main>', '</footer>\n</main>\n</div>')
    // Make BigQuery clickable
    .replace('<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">\n<span className="material-symbols-outlined">analytics</span>\n<span className="text-sm">BigQuery Analytics</span>\n</a>', 
             '<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => onViewSwitch(\'analysis\')}>\n<span className="material-symbols-outlined">analytics</span>\n<span className="text-sm">BigQuery Analytics</span>\n</a>');

fs.writeFileSync('webapp/src/components/EnterpriseDashboard.tsx', screen1Jsx);

const screen2Html = fs.readFileSync('webapp/src/stitch/screen2.html', 'utf8');
const screen2Jsx = htmlToJsx(screen2Html)
    .replace('export function Component({ onViewSwitch })', 'export function QueryAnalysis({ onViewSwitch })')
    .replace('<a className="text-slate-400 hover:text-white text-sm font-medium transition-colors" href="#">Dashboard</a>', 
             '<a className="text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer" onClick={() => onViewSwitch(\'dashboard\')}>Dashboard</a>')
    .replace(/<circle([^>]*[^\/])>/g, '<circle$1 />')
    .replace(/<path([^>]*[^\/])>/g, '<path$1 />');

fs.writeFileSync('webapp/src/components/QueryAnalysis.tsx', screen2Jsx);

console.log('Successfully generated React components from HTML');
