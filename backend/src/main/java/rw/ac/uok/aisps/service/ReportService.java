package rw.ac.uok.aisps.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import rw.ac.uok.aisps.dto.AdminAnalyticsResponse;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

/**
 * Report export for administrators (Thesis Section 4.3.1, "Reporting and
 * Analytics: ... export reports in PDF or Excel format").
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final DashboardService dashboardService;

    public byte[] generateAnalyticsExcel() {
        AdminAnalyticsResponse data = dashboardService.adminAnalytics();

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle headerStyle = headerStyle(workbook);

            Sheet summary = workbook.createSheet("Summary");
            int r = 0;
            r = writeRow(summary, r, headerStyle, "Metric", "Value");
            writeRow(summary, r++, null, "Total students", String.valueOf(data.totalStudents()));
            writeRow(summary, r++, null, "Total courses", String.valueOf(data.totalCourses()));
            writeRow(summary, r++, null, "Low risk", String.valueOf(data.riskDistribution().getOrDefault("LOW", 0L)));
            writeRow(summary, r++, null, "Medium risk", String.valueOf(data.riskDistribution().getOrDefault("MEDIUM", 0L)));
            writeRow(summary, r++, null, "High risk", String.valueOf(data.riskDistribution().getOrDefault("HIGH", 0L)));
            autosize(summary, 2);

            Sheet byProgram = workbook.createSheet("By Program");
            r = 0;
            r = writeRow(byProgram, r, headerStyle, "Program", "Low", "Medium", "High");
            for (var p : data.byProgram()) {
                r = writeRow(byProgram, r, null, p.program(), String.valueOf(p.low()), String.valueOf(p.medium()), String.valueOf(p.high()));
            }
            autosize(byProgram, 4);

            Sheet byCourse = workbook.createSheet("By Course");
            r = 0;
            r = writeRow(byCourse, r, headerStyle, "Course Code", "Course Name", "Low", "Medium", "High");
            for (var c : data.byCourse()) {
                r = writeRow(byCourse, r, null, c.courseCode(), c.courseName(), String.valueOf(c.low()), String.valueOf(c.medium()), String.valueOf(c.high()));
            }
            autosize(byCourse, 5);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate Excel report: " + e.getMessage(), e);
        }
    }

    public byte[] generateAnalyticsPdf() {
        AdminAnalyticsResponse data = dashboardService.adminAnalytics();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            document.add(new Paragraph("AI-Based Student Performance System -- Analytics Report", titleFont));
            document.add(new Paragraph("Generated: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), bodyFont));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Summary", headingFont));
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            addRow(summaryTable, "Total students", String.valueOf(data.totalStudents()), bodyFont, true);
            addRow(summaryTable, "Total courses", String.valueOf(data.totalCourses()), bodyFont, true);
            addRow(summaryTable, "Low risk", String.valueOf(data.riskDistribution().getOrDefault("LOW", 0L)), bodyFont, true);
            addRow(summaryTable, "Medium risk", String.valueOf(data.riskDistribution().getOrDefault("MEDIUM", 0L)), bodyFont, true);
            addRow(summaryTable, "High risk", String.valueOf(data.riskDistribution().getOrDefault("HIGH", 0L)), bodyFont, true);
            document.add(summaryTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Risk by Program", headingFont));
            PdfPTable programTable = new PdfPTable(4);
            programTable.setWidthPercentage(100);
            addHeaderRow(programTable, bodyFont, "Program", "Low", "Medium", "High");
            for (var p : data.byProgram()) {
                addDataRow(programTable, bodyFont, p.program(), String.valueOf(p.low()), String.valueOf(p.medium()), String.valueOf(p.high()));
            }
            document.add(programTable);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Risk by Course", headingFont));
            PdfPTable courseTable = new PdfPTable(5);
            courseTable.setWidthPercentage(100);
            addHeaderRow(courseTable, bodyFont, "Code", "Course", "Low", "Medium", "High");
            for (var c : data.byCourse()) {
                addDataRow(courseTable, bodyFont, c.courseCode(), c.courseName(), String.valueOf(c.low()), String.valueOf(c.medium()), String.valueOf(c.high()));
            }
            document.add(courseTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate PDF report: " + e.getMessage(), e);
        }
    }

    private int writeRow(Sheet sheet, int rowIndex, CellStyle headerStyle, String... values) {
        Row row = sheet.createRow(rowIndex);
        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(values[i]);
            if (headerStyle != null) cell.setCellStyle(headerStyle);
        }
        return rowIndex + 1;
    }

    private CellStyle headerStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private void autosize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) sheet.autoSizeColumn(i);
    }

    private void addRow(PdfPTable table, String label, String value, Font font, boolean bold) {
        table.addCell(new PdfPCell(new com.lowagie.text.Phrase(label, font)));
        table.addCell(new PdfPCell(new com.lowagie.text.Phrase(value, font)));
    }

    private void addHeaderRow(PdfPTable table, Font font, String... headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new com.lowagie.text.Phrase(h, font));
            table.addCell(cell);
        }
    }

    private void addDataRow(PdfPTable table, Font font, String... values) {
        for (String v : values) {
            table.addCell(new PdfPCell(new com.lowagie.text.Phrase(v, font)));
        }
    }
}
