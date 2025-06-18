// ...existing code...

    async captureTableOnly(routineData) {
        console.log('📸 DEBUG: Capturing table only with manual backgrounds');
        
        try {
            // ...existing code...
            
            // Step 2: Capture table without backgrounds at 3x resolution
            const originalCanvas = await html2canvas(tableElement, {
                backgroundColor: null,
                scale: 6, // Changed from 2 to 6 for 3x higher resolution
                logging: false,
                useCORS: true,
                allowTaint: false,
                ignoreElements: (element) => {
                    return element.tagName === 'H2' || element.tagName === 'H3';
                }
            });

            // ...existing code...
        } catch (error) {
            // ...existing code...
        }
    }

    async addManutalBackgrounds(originalCanvas, tableElement, routineData) {
        console.log('🎨 DEBUG: Adding manual backgrounds at 3x resolution');

        // ...existing code...

        rows.forEach((row, rowIndex) => {
            const rowCells = row.querySelectorAll('td, th');
            const rect = row.getBoundingClientRect();
            const tableRect = tableElement.getBoundingClientRect();
            
            // Calculate relative position with 6x scale (3x higher than before)
            const relativeTop = (rect.top - tableRect.top) * 6;
            const relativeHeight = rect.height * 6;
            
            // ...existing code...
        });

        // ...existing code...
    }

    // Alternative approach - recreate table entirely on canvas
    async createTableFromScratch(routineData) {
        console.log('🏗️ DEBUG: Creating table from scratch on canvas at 3x resolution');

        const scale = 3; // 3x resolution multiplier
        const padding = 12 * scale;
        const cellHeight = 40 * scale;
        const headerHeight = 50 * scale;
        const borderWidth = 2 * scale;
        
        // Calculate table data
        const tableData = this.prepareTableData(routineData);
        const columnWidths = [120, 80, 100, 200, 100, 150].map(width => width * scale); // Scale all widths
        const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + (borderWidth * (columnWidths.length + 1));
        const totalHeight = headerHeight + (tableData.rows.length * cellHeight) + (borderWidth * (tableData.rows.length + 2));

        // Create canvas at 3x resolution
        this.canvas = document.createElement('canvas');
        this.canvas.width = totalWidth;
        this.canvas.height = totalHeight;
        this.ctx = this.canvas.getContext('2d');

        // Scale fonts for high resolution
        this.ctx.scale(1, 1); // Keep 1:1 but use larger font sizes

        // ...existing code...

        // Header text with scaled font
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `bold ${14 * scale}px Arial, sans-serif`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        // ...existing code...

        // Draw data rows with scaled font
        this.ctx.font = `${14 * scale}px Arial, sans-serif`;
        
        // ...existing code...

        // Draw borders with scaled dimensions
        this.drawTableBorders(totalWidth, totalHeight, columnWidths, headerHeight, cellHeight, tableData.rows.length, scale);

        return this.canvas.toDataURL('image/png', 1.0);
    }

    // ...existing code...

    drawTableBorders(totalWidth, totalHeight, columnWidths, headerHeight, cellHeight, rowCount, scale = 3) {
        this.ctx.strokeStyle = '#dddddd';
        this.ctx.lineWidth = 1 * scale; // Scale line width

        // ...existing code...

        // Outer border with scaled width
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(1 * scale, 1 * scale, totalWidth - (2 * scale), totalHeight - (2 * scale));
    }

    // ...existing code...