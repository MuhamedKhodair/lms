import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiError } from "@/lib/utils";
import PDFDocument from "pdfkit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        course: { select: { id: true, title: true, instructor: { select: { name: true } } } },
      },
    });

    if (!certificate) return apiError("Certificate not found", 404);
    if (certificate.userId !== user.id && user.role !== "ADMIN") return apiError("Forbidden", 403);

    // Generate PDF
    const pdf = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => buffers.push(chunk));

    const pdfDone = new Promise<Buffer>((resolve, reject) => {
      pdf.on("end", () => resolve(Buffer.concat(buffers)));
      pdf.on("error", reject);
    });

    const pageWidth = pdf.page.width;

    // Decorative border
    pdf.rect(20, 20, pageWidth - 40, pdf.page.height - 40)
      .strokeColor("#4F46E5")
      .lineWidth(3)
      .stroke();

    // Header decoration
    pdf.rect(0, 0, pageWidth, 8).fill("#4F46E5");
    pdf.rect(0, pdf.page.height - 8, pageWidth, 8).fill("#4F46E5");

    // Title
    pdf.moveDown(4)
      .font("Helvetica-Bold")
      .fontSize(32)
      .fillColor("#1e1b4b")
      .text("Certificate of Completion", { align: "center" });

    // Medal emoji
    pdf.moveDown(1)
      .fontSize(48)
      .text("🏆", { align: "center" });

    // Body
    pdf.moveDown(1)
      .font("Helvetica")
      .fontSize(16)
      .fillColor("#64748b")
      .text("This certificate is proudly presented to", { align: "center" });

    pdf.moveDown(1.5)
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor("#0f172a")
      .text(certificate.user.name, { align: "center" });

    pdf.moveDown(1)
      .font("Helvetica")
      .fontSize(16)
      .fillColor("#64748b")
      .text("for successfully completing the course", { align: "center" });

    pdf.moveDown(0.5)
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#4f46e5")
      .text(certificate.course.title, { align: "center" });

    // Instructor / date
    pdf.moveDown(2)
      .font("Helvetica")
      .fontSize(14)
      .fillColor("#64748b")
      .text(`Instructor: ${certificate.course.instructor.name}`, { align: "center" })
      .text(`Issued: ${certificate.issuedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, { align: "center" });

    // Footer
    pdf.moveDown(3)
      .fontSize(10)
      .fillColor("#94a3b8")
      .text(`Certificate ID: ${certificate.id}`, { align: "center" });

    // Second page with seal-like circle
    pdf.addPage({ size: "A4", margin: 50 });
    // Decorative border
    pdf.rect(20, 20, pageWidth - 40, pdf.page.height - 40)
      .strokeColor("#4F46E5")
      .lineWidth(3)
      .stroke();

    const centerY = pdf.page.height / 2 - 50;
    const centerX = pageWidth / 2;

    // Draw a medal-like decorative circle
    pdf.circle(centerX, centerY, 60)
      .strokeColor("#4F46E5")
      .lineWidth(4)
      .stroke();

    pdf.circle(centerX, centerY, 50)
      .strokeColor("#8b5cf6")
      .lineWidth(1.5)
      .stroke();

    pdf.moveDown(2)
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1e1b4b")
      .text("COMPLETION\nCERTIFICATE", { align: "center" });

    pdf.moveDown(1)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#94a3b8")
      .text("Verify at: lms.example.com/verify/" + certificate.id, { align: "center" });

    pdf.end();

    const pdfBuffer = await pdfDone;
    const filename = `${certificate.course.title.replace(/\s+/g, "-").toLowerCase()}-certificate.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Certificate download error:", error);
    return apiError("Internal server error", 500);
  }
}
