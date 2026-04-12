import re

with open('components/seo-crawler/ArchitectureMap.tsx', 'r') as f:
    content = f.read()

# Instead of relying on a prop, ArchitectureMap will manage its own workspace.
# We will change the export default to:
new_header = """export default function ArchitectureMap() {
    const {
        pages, graphContainerRef, graphDimensions, fgRef, graphData,
        selectedPage, setSelectedPage, handleNodeClick, viewMode
    } = useSeoCrawler();

    const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
    const [hoveredMapNode, setHoveredMapNode] = useState<any | null>(null);
    const [mapScope, setMapScope] = useState<'all' | 'issues' | 'deep' | 'important' | 'focus'>('all');
    const [isMapWorkspaceOpen, setIsMapWorkspaceOpen] = useState(false);"""

content = re.sub(r'export default function ArchitectureMap.*?setIsMapWorkspaceOpen\(false\);', new_header, content, flags=re.DOTALL)

# Wrap the render logic
render_func_start = """    const renderMap = (isWorkspace = false) => {
        const viewportWidth = isWorkspace ? workspaceGraphWidth : graphWidth;
        const viewportHeight = isWorkspace ? workspaceGraphHeight : graphHeight;

        return ("""

content = content.replace("        const viewportWidth = isWorkspace ? workspaceGraphWidth : graphWidth;\n        const viewportHeight = isWorkspace ? workspaceGraphHeight : graphHeight;\n\n        return (", render_func_start)

# End the renderMap and return both
render_func_end = """        );
    };

    return (
        <>
            {renderMap(false)}
            {isMapWorkspaceOpen && renderMap(true)}
        </>
    );
}
"""

content = re.sub(r'        \);\n\}$', render_func_end, content)

# Also fix the button inside to use isWorkspace instead of workspace
content = content.replace("{workspace ?", "{isWorkspace ?").replace("workspace ?", "isWorkspace ?")


with open('components/seo-crawler/ArchitectureMap.tsx', 'w') as f:
    f.write(content)

print("ArchitectureMap.tsx updated!")
