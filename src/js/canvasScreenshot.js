class CanvasScreenshotCapture {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }    async createTableFromScratch(themeConfig = null) {
        // Default theme config if none provided (fallback to light theme)
        if (!themeConfig) {
            themeConfig = {
                name: 'light',
                backgroundColor: '#ffffff',
                textColor: '#333333',
                borderColor: '#cccccc'
            };
        }

        console.log('🎨 DEBUG: Canvas using theme:', themeConfig.name, 'with background:', themeConfig.backgroundColor);
        // Get the actual table element from DOM
        const table = document.querySelector('#combined-routine table');
        const tableBody = document.getElementById('routine-table-body');

        if (!table || !tableBody || tableBody.children.length === 0) {
            throw new Error('No routine table found to capture');
        }

        // Extract exact data from the rendered table first to analyze content
        const tableData = this.extractExactTableData(table);

        // Calculate maximum users to determine font scaling
        const maxUsersInTable = this.getMaxUsersInTable(tableData);

        // Calculate dynamic row heights based on content
        const dynamicRowHeights = this.calculateDynamicRowHeights(tableData);        // Table configuration with corrected font scaling that makes sense
        const config = {
            padding: 12,
            baseCellHeight: 50,
            headerHeight: 60,
            borderWidth: 1,
            baseFontSize: this.calculateDynamicFontSize(maxUsersInTable, 14), // Reasonable base size
            headerFontSize: this.calculateDynamicFontSize(maxUsersInTable, 16), // Slightly larger for headers
            entryFontSize: this.calculateDynamicFontSize(maxUsersInTable, 12), // Smaller for routine entries
            fontFamily: 'Inter, Arial, sans-serif',
            minEntryHeight: Math.max(18, 14 + (maxUsersInTable * 0.3)), // Modest scaling
            maxEntryHeight: Math.max(32, 24 + (maxUsersInTable * 0.8)), // Controlled scaling
            entryPadding: Math.max(2, 1 + (maxUsersInTable * 0.05))     // Minimal padding scaling
        };// Calculate column widths based on content - pass dynamicRowHeights
        const columnWidths = this.calculateOptimalColumnWidths(tableData, config, dynamicRowHeights);

        // 4x quality scaling
        const qualityScale = 4;
        const baseWidth = columnWidths.reduce((sum, width) => sum + width, 0) + (config.borderWidth * (columnWidths.length + 1));
        const baseHeight = config.headerHeight +
                          dynamicRowHeights.reduce((sum, height) => sum + height, 0) +
                          (config.borderWidth * (dynamicRowHeights.length + 1));

        const totalWidth = baseWidth * qualityScale;
        const totalHeight = baseHeight * qualityScale;

        // Create canvas with 4x quality
        this.canvas = document.createElement('canvas');
        this.canvas.width = totalWidth;
        this.canvas.height = totalHeight;
        this.ctx = this.canvas.getContext('2d');

        // Scale the context for 4x quality
        this.ctx.scale(qualityScale, qualityScale);

        // Scale the config for 4x quality        // Set high quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';        // Draw theme-appropriate background
        this.ctx.fillStyle = themeConfig.backgroundColor;
        this.ctx.fillRect(0, 0, baseWidth, baseHeight);

        // Draw table components with original dimensions (scaling handled by context)
        this.drawExactTableStructure(config, columnWidths, tableData, baseWidth, baseHeight, dynamicRowHeights, themeConfig);

        return this.canvas.toDataURL('image/png', 1.0);
    }extractExactTableData(table) {
        // Get headers
        const headerCells = table.querySelectorAll('thead th');
        const headers = Array.from(headerCells).map(th => th.textContent.trim());

        // Get all data rows
        const rows = [];
        const tableRows = table.querySelectorAll('tbody tr');        tableRows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            const rowData = {
                timeSlot: cells[0].textContent.trim(),
                timeSlotHtml: cells[0].innerHTML.trim(), // Store HTML content for br tag handling
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
    }    calculateOptimalColumnWidths(tableData, config, dynamicRowHeights) {
        // Calculate dynamic widths based on content density
        const timeWidth = 160;

        // Calculate maximum entries per cell across all rows and days
        let maxEntriesPerCell = 1;
        tableData.rows.forEach(row => {
            row.days.forEach(day => {
                maxEntriesPerCell = Math.max(maxEntriesPerCell, day.entries.length);
            });
        });

        // Adjust day column width based on content density
        // More users = wider columns to accommodate text without excessive truncation
        let dayWidth = 180; // Base width for 1-3 users

        if (maxEntriesPerCell >= 4 && maxEntriesPerCell <= 5) {
            dayWidth = 220; // Wider for 4-5 users
        } else if (maxEntriesPerCell >= 6 && maxEntriesPerCell <= 7) {
            dayWidth = 250; // Even wider for 6-7 users
        } else if (maxEntriesPerCell >= 8 && maxEntriesPerCell <= 9) {
            dayWidth = 280; // Wider for 8-9 users
        } else if (maxEntriesPerCell >= 10) {
            dayWidth = 320; // Maximum width for 10+ users
        }

        // Calculate total dimensions for debugging
        const columnWidths = [timeWidth, dayWidth, dayWidth, dayWidth, dayWidth, dayWidth, dayWidth, dayWidth];
        const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + (config.borderWidth * (columnWidths.length + 1));
        const totalHeight = config.headerHeight +
                          dynamicRowHeights.reduce((sum, height) => sum + height, 0) +
                          (config.borderWidth * (dynamicRowHeights.length + 1));

        // Debug logging for dynamic sizing
        console.log('🎯 DEBUG: Dynamic Screenshot Sizing');
        console.log('📊 DEBUG: Max entries per cell:', maxEntriesPerCell);
        console.log('📏 DEBUG: Calculated day width:', dayWidth);
        console.log('🔤 DEBUG: Dynamic font sizes - Base:', config.baseFontSize, 'Header:', config.headerFontSize, 'Entry:', config.entryFontSize);
        console.log('📋 DEBUG: Row heights:', dynamicRowHeights);
        console.log('🖼️ DEBUG: Canvas dimensions:', totalWidth, 'x', totalHeight);

        return columnWidths;
    }    drawExactTableStructure(config, columnWidths, tableData, totalWidth, totalHeight, dynamicRowHeights, themeConfig) {
        // Draw outer border with theme-aware color
        this.ctx.strokeStyle = themeConfig.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, totalWidth - 2, totalHeight - 2);

        let currentY = 0;

        // Draw header with theme config
        this.drawTableHeader(config, columnWidths, tableData.headers, currentY, themeConfig);
        currentY += config.headerHeight + config.borderWidth;        // Draw data rows with dynamic heights and theme config
        tableData.rows.forEach((rowData, rowIndex) => {
            const rowHeight = dynamicRowHeights[rowIndex];
            this.drawTableRow(config, columnWidths, rowData, currentY, rowIndex, rowHeight, { themeConfig, totalWidth });
            currentY += rowHeight + config.borderWidth;
        });

        // Draw grid lines with dynamic heights and theme config
        this.drawGridLines(config, columnWidths, tableData, totalWidth, totalHeight, dynamicRowHeights, themeConfig);
    }drawTableHeader(config, columnWidths, headers, startY, themeConfig) {
        // Header background - slightly darker than main background
        let headerBg;
        if (themeConfig.name === 'dark') {
            headerBg = '#2a3f54';
        } else if (themeConfig.name === 'light') {
            headerBg = '#f8f9fa';
        } else {
            headerBg = '#ffd1e6';
        }

        this.ctx.fillStyle = headerBg;
        this.ctx.fillRect(0, startY, this.canvas.width, config.headerHeight);        // Header text with theme-aware color
        this.ctx.fillStyle = themeConfig.textColor;
        this.ctx.font = `bold ${config.headerFontSize}px ${config.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let currentX = 0;
        headers.forEach((header, index) => {
            const cellCenterX = currentX + (columnWidths[index] / 2);
            const cellCenterY = startY + (config.headerHeight / 2);

            this.ctx.fillText(header, cellCenterX, cellCenterY);
            currentX += columnWidths[index] + config.borderWidth;
        });
    }    drawTableRow(config, columnWidths, rowData, startY, rowIndex, rowHeight, options) {
        const { themeConfig, totalWidth } = options;
        // Row background (alternating for better readability) with theme awareness
        // Using very subtle color differences (2-3% shade difference)
        let bgColor;
        if (themeConfig.name === 'dark') {
            bgColor = rowIndex % 2 === 0 ? '#34495e' : '#324556'; // 3% darker
        } else if (themeConfig.name === 'light') {
            bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#fcfcfc'; // 2% darker
        } else { // pink theme
            bgColor = rowIndex % 2 === 0 ? '#ffe6f2' : '#fde1ed'; // 3% darker
        }

        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, startY, totalWidth, rowHeight);

        let currentX = 0;        // Draw time cell (handle two-line format) with theme-aware text color
        this.ctx.fillStyle = themeConfig.textColor;
        this.ctx.font = `${config.baseFontSize}px ${config.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Check if timeSlotHtml contains br tag and split accordingly
        if (rowData.timeSlotHtml && rowData.timeSlotHtml.includes('<br>')) {
            // Split by br tag
            const timeParts = rowData.timeSlotHtml.split('<br>').map(part => part.trim());

            if (timeParts.length >= 2) {
                // Draw start time on first line
                this.ctx.fillText(timeParts[0], currentX + (columnWidths[0] / 2), startY + (rowHeight / 2) - 8);
                // Draw end time on second line
                this.ctx.fillText(timeParts[1], currentX + (columnWidths[0] / 2), startY + (rowHeight / 2) + 8);
            } else {
                // Fallback to single line
                this.ctx.fillText(rowData.timeSlot, currentX + (columnWidths[0] / 2), startY + (rowHeight / 2));
            }
        } else {
            // Single line format (fallback)
            this.ctx.fillText(rowData.timeSlot, currentX + (columnWidths[0] / 2), startY + (rowHeight / 2));
        }
        currentX += columnWidths[0] + config.borderWidth;

        // Draw day cells with routine entries
        rowData.days.forEach((dayData, dayIndex) => {
            const cellX = currentX;
            const cellY = startY;
            const cellWidth = columnWidths[dayIndex + 1];
            const cellHeight = rowHeight;            if (dayData.entries.length > 0) {
                // Calculate dynamic entry dimensions
                const availableHeight = cellHeight - (config.entryPadding * 2);
                const entryHeight = Math.max(
                    config.minEntryHeight,
                    Math.min(
                        config.maxEntryHeight,
                        (availableHeight - (config.entryPadding * (dayData.entries.length - 1))) / dayData.entries.length
                    )
                );
                const entryWidth = cellWidth - 8;                // Use the pre-calculated dynamic font size from config
                // This ensures consistent scaling based on total user count
                const fontSize = config.entryFontSize;

                dayData.entries.forEach((entry, entryIndex) => {
                    const entryX = cellX + 4;
                    const entryY = cellY + config.entryPadding + (entryIndex * (entryHeight + config.entryPadding));

                    // Draw entry background with rounded corners effect
                    this.ctx.fillStyle = this.parseColor(entry.backgroundColor);
                    this.ctx.fillRect(entryX, entryY, entryWidth, entryHeight);                    // Draw entry text with dynamic font size
                    this.ctx.fillStyle = this.parseColor(entry.color);
                    this.ctx.font = `${fontSize}px ${config.fontFamily}`;                    // ABSOLUTE NO-WRAP LOGIC: Measure actual text width and truncate precisely
                    let displayText = entry.text;
                    
                    // Calculate available width with minimal padding
                    const horizontalPadding = Math.max(2, fontSize * 0.15); // Very conservative padding
                    const maxTextWidth = entryWidth - (horizontalPadding * 2);
                    
                    // Set font before measuring
                    this.ctx.font = `${fontSize}px ${config.fontFamily}`;
                    
                    // Measure actual text width and truncate if needed
                    let textWidth = this.ctx.measureText(displayText).width;
                    
                    // If text is too wide, truncate with ellipsis
                    if (textWidth > maxTextWidth && maxTextWidth > 10) {
                        // Binary search for optimal truncation point
                        let left = 0;
                        let right = displayText.length;
                        let bestFit = '';
                        
                        while (left <= right) {
                            const mid = Math.floor((left + right) / 2);
                            const testText = displayText.substring(0, mid) + '...';
                            const testWidth = this.ctx.measureText(testText).width;
                            
                            if (testWidth <= maxTextWidth) {
                                bestFit = testText;
                                left = mid + 1;
                            } else {
                                right = mid - 1;
                            }
                        }
                        
                        displayText = bestFit || '...';
                    } else if (maxTextWidth <= 10) {
                        displayText = '...';
                    }

                    // Set text alignment and draw (SINGLE LINE ONLY)
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    
                    const textX = entryX + (entryWidth / 2);
                    const textY = entryY + (entryHeight / 2);
                    
                    // Draw text (guaranteed to fit)
                    this.ctx.fillText(displayText, textX, textY);
                });
            }

            currentX += columnWidths[dayIndex + 1] + config.borderWidth;
        });
    }    drawGridLines(config, columnWidths, tableData, totalWidth, totalHeight, dynamicRowHeights, themeConfig) {
        // Grid lines with theme-aware color
        this.ctx.strokeStyle = themeConfig.borderColor;
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
        });        // Horizontal lines with dynamic heights
        let y = config.headerHeight + config.borderWidth;
        dynamicRowHeights.forEach(rowHeight => {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(totalWidth, y);
            this.ctx.stroke();
            y += rowHeight + config.borderWidth;
        });        // Header separator (thicker line) with theme-aware color
        this.ctx.strokeStyle = themeConfig.borderColor;
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
    }    /**
     * Calculate dynamic row heights based on the maximum number of entries in each row
     * @param {Object} tableData - Extracted table data
     * @returns {Array} Array of heights for each row
     */
    calculateDynamicRowHeights(tableData) {
        const minCellHeight = 50;

        return tableData.rows.map(rowData => {
            // Find the maximum number of entries in any cell for this row
            const maxEntriesInRow = Math.max(...rowData.days.map(day => day.entries.length), 1);

            if (maxEntriesInRow <= 1) {
                return minCellHeight;
            }

            // Progressive height calculation based on entry count
            // More stable approach that doesn't cause layout issues
            let cellHeight;
            if (maxEntriesInRow <= 2) {
                cellHeight = 70;
            } else if (maxEntriesInRow <= 3) {
                cellHeight = 90;
            } else if (maxEntriesInRow <= 4) {
                cellHeight = 110;
            } else if (maxEntriesInRow <= 6) {
                cellHeight = 140;
            } else if (maxEntriesInRow <= 8) {
                cellHeight = 170;
            } else {
                // 9+ users
                cellHeight = 200;
            }

            return Math.max(minCellHeight, cellHeight);
        });
    }    /**
     * Calculate the maximum number of users present in the table
     * @param {Object} tableData - Extracted table data
     * @returns {number} Maximum number of users found
     */
    getMaxUsersInTable(tableData) {
        let maxUsers = 0;
        tableData.rows.forEach(row => {
            row.days.forEach(day => {
                if (day.entries.length > maxUsers) {
                    maxUsers = day.entries.length;
                }
            });
        });
        return Math.max(maxUsers, 1); // At least 1 user
    }    /**
     * Calculate dynamic font size based on number of users
     * @param {number} userCount - Number of users
     * @param {number} baseFontSize - Base font size for 1-2 users
     * @returns {number} Calculated font size
     */
    calculateDynamicFontSize(userCount, baseFontSize) {
        // CORRECTED: Scale DOWN as user count increases to fit more content
        // Logical scaling: more users = smaller fonts to prevent wrapping

        let scaleFactor;
        if (userCount <= 2) {
            scaleFactor = 1.0;     // Full size for 1-2 users
        } else if (userCount <= 4) {
            scaleFactor = 0.9;     // 10% smaller for 3-4 users
        } else if (userCount <= 6) {
            scaleFactor = 0.8;     // 20% smaller for 5-6 users
        } else if (userCount <= 8) {
            scaleFactor = 0.7;     // 30% smaller for 7-8 users
        } else {
            scaleFactor = 0.6;     // 40% smaller for 9+ users (maximum shrinkage)
        }

        const scaledFontSize = Math.max(8, Math.round(baseFontSize * scaleFactor)); // Minimum 8px font

        console.log(`🔤 DEBUG: Corrected Font scaling - Users: ${userCount}, Base: ${baseFontSize}px → Scale: ${scaleFactor}x → Final: ${scaledFontSize}px`);
        return scaledFontSize;
    }
}

// Export for use in routineManager
window.CanvasScreenshotCapture = CanvasScreenshotCapture;