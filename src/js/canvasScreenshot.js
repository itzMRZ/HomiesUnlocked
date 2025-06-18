class CanvasScreenshotCapture {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }

    async createTableFromScratch() {
        console.log('🏗️ DEBUG: Creating exact table replica on canvas');

        // Get the actual table element from DOM
        const table = document.querySelector('#combined-routine table');
        const tableBody = document.getElementById('routine-table-body');
        
        if (!table || !tableBody || tableBody.children.length === 0) {
            throw new Error('No routine table found to capture');
        }

        // Table configuration matching the site's appearance
        const config = {
            padding: 12,
            cellHeight: 50,
            headerHeight: 60,
            borderWidth: 1,
            fontSize: 12,
            headerFontSize: 14,
            fontFamily: 'Inter, Arial, sans-serif'
        };

        // Extract exact data from the rendered table
        const tableData = this.extractExactTableData(table);
        console.log('📊 DEBUG: Extracted table data:', tableData);

        // Calculate column widths based on content
        const columnWidths = this.calculateOptimalColumnWidths(tableData, config);
        const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + (config.borderWidth * (columnWidths.length + 1));
        const totalHeight = config.headerHeight + (tableData.rows.length * config.cellHeight) + (config.borderWidth * (tableData.rows.length + 1));

        console.log('📏 DEBUG: Canvas dimensions:', { totalWidth, totalHeight, rows: tableData.rows.length });

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = totalWidth;
        this.canvas.height = totalHeight;
        this.ctx = this.canvas.getContext('2d');

        // Set high quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Draw table components
        this.drawExactTableStructure(config, columnWidths, tableData, totalWidth, totalHeight);

        console.log('✅ DEBUG: Exact table replica created successfully');
        return this.canvas.toDataURL('image/png', 1.0);
    }

    extractExactTableData(table) {
        console.log('📋 DEBUG: Extracting exact data from rendered table');
        
        // Get headers
        const headerCells = table.querySelectorAll('thead th');
        const headers = Array.from(headerCells).map(th => th.textContent.trim());
        
        // Get all data rows
        const rows = [];
        const tableRows = table.querySelectorAll('tbody tr');
        
        tableRows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            const rowData = {
                timeSlot: cells[0].textContent.trim(),
                days: []
            };
            
            // Process each day column (skip time column)
            for (let i = 1; i < cells.length; i++) {
                const cell = cells[i];
                const routineEntries = cell.querySelectorAll('.routine-entry');
                
                const dayData = {
                    entries: []
                };
                
                routineEntries.forEach(entry => {
                    const style = window.getComputedStyle(entry);
                    dayData.entries.push({
                        text: entry.textContent.trim(),
                        backgroundColor: style.backgroundColor,
                        color: style.color
                    });
                });
                
                rowData.days.push(dayData);
            }
            
            rows.push(rowData);
        });

        return { headers, rows };
    }

    calculateOptimalColumnWidths(tableData, config) {
        // Set optimal widths for readability
        const timeWidth = 160;
        const dayWidth = 180;
        
        return [timeWidth, dayWidth, dayWidth, dayWidth, dayWidth, dayWidth, dayWidth, dayWidth];
    }

    drawExactTableStructure(config, columnWidths, tableData, totalWidth, totalHeight) {
        console.log('🎨 DEBUG: Drawing exact table structure');

        // Draw outer border
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, totalWidth - 2, totalHeight - 2);

        let currentY = 0;

        // Draw header
        this.drawTableHeader(config, columnWidths, tableData.headers, currentY);
        currentY += config.headerHeight + config.borderWidth;

        // Draw data rows
        tableData.rows.forEach((rowData, rowIndex) => {
            this.drawTableRow(config, columnWidths, rowData, currentY, rowIndex);
            currentY += config.cellHeight + config.borderWidth;
        });

        // Draw grid lines
        this.drawGridLines(config, columnWidths, tableData, totalWidth, totalHeight);
    }

    drawTableHeader(config, columnWidths, headers, startY) {
        // Header background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, startY, this.canvas.width, config.headerHeight);

        // Header text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `bold ${config.headerFontSize}px ${config.fontFamily}`;

        let currentX = 0;
        headers.forEach((header, index) => {
            const cellCenterX = currentX + (columnWidths[index] / 2);
            const cellCenterY = startY + (config.headerHeight / 2);
            
            this.ctx.fillText(header, cellCenterX, cellCenterY);
            currentX += columnWidths[index] + config.borderWidth;
        });
    }

    drawTableRow(config, columnWidths, rowData, startY, rowIndex) {
        // Row background (alternating for better readability)
        const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, startY, this.canvas.width, config.cellHeight);

        let currentX = 0;

        // Draw time cell
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${config.fontSize}px ${config.fontFamily}`;
        this.ctx.fillText(rowData.timeSlot, currentX + (columnWidths[0] / 2), startY + (config.cellHeight / 2));
        currentX += columnWidths[0] + config.borderWidth;

        // Draw day cells with routine entries
        rowData.days.forEach((dayData, dayIndex) => {
            const cellX = currentX;
            const cellY = startY;
            const cellWidth = columnWidths[dayIndex + 1];
            const cellHeight = config.cellHeight;

            if (dayData.entries.length > 0) {
                // Calculate entry dimensions
                const entryHeight = Math.min(cellHeight / dayData.entries.length, cellHeight - 4);
                const entryWidth = cellWidth - 8;

                dayData.entries.forEach((entry, entryIndex) => {
                    const entryX = cellX + 4;
                    const entryY = cellY + 2 + (entryIndex * entryHeight);

                    // Draw entry background
                    this.ctx.fillStyle = this.parseColor(entry.backgroundColor);
                    this.ctx.fillRect(entryX, entryY, entryWidth, entryHeight - 2);

                    // Draw entry text
                    this.ctx.fillStyle = this.parseColor(entry.color);
                    this.ctx.font = `${config.fontSize - 1}px ${config.fontFamily}`;
                    
                    // Truncate text if too long
                    let displayText = entry.text;
                    const maxWidth = entryWidth - 8;
                    while (this.ctx.measureText(displayText).width > maxWidth && displayText.length > 3) {
                        displayText = displayText.substring(0, displayText.length - 4) + '...';
                    }

                    this.ctx.fillText(
                        displayText,
                        entryX + (entryWidth / 2),
                        entryY + (entryHeight / 2)
                    );
                });
            }

            currentX += columnWidths[dayIndex + 1] + config.borderWidth;
        });
    }

    drawGridLines(config, columnWidths, tableData, totalWidth, totalHeight) {
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = config.borderWidth;

        // Vertical lines
        let x = 0;
        columnWidths.forEach((width, index) => {
            x += width;
            if (index < columnWidths.length - 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, totalHeight);
                this.ctx.stroke();
            }
            x += config.borderWidth;
        });

        // Horizontal lines
        let y = config.headerHeight;
        for (let i = 0; i <= tableData.rows.length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(totalWidth, y);
            this.ctx.stroke();
            y += config.cellHeight + config.borderWidth;
        }

        // Header separator (thicker line)
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, config.headerHeight);
        this.ctx.lineTo(totalWidth, config.headerHeight);
        this.ctx.stroke();
    }

    parseColor(colorString) {
        // Handle different color formats
        if (colorString.startsWith('rgb')) {
            return colorString;
        } else if (colorString.startsWith('#')) {
            return colorString;
        } else {
            // Named colors or other formats
            return colorString || '#000000';
        }
    }
}

// Export for use in routineManager
window.CanvasScreenshotCapture = CanvasScreenshotCapture;