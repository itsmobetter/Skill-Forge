
import { storage } from './storage';
import { InsertSOP } from '@shared/schema';

// Default SOPs focused on quality management
export const defaultSOPs: Omit<InsertSOP, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'ISO 9001:2015 Document Control Procedure',
    objective: 'To establish a standard procedure for controlling documents required by the quality management system.',
    scope: 'This procedure applies to all documents used within the organization that affect the quality management system.',
    responsibilities: {
      "Quality Manager": "Oversee document control system and ensure compliance",
      "Department Heads": "Ensure document procedures are followed within their departments",
      "Document Controller": "Maintain the document control system and repository",
      "All Employees": "Use only current approved versions of documents"
    },
    procedure: {
      "Document Creation": "New documents are drafted according to established templates. Author must ensure content meets requirements.",
      "Document Review": "Documents must be reviewed by relevant stakeholders and subject matter experts before approval.",
      "Document Approval": "Final approval must be given by authorized personnel before documents are released.",
      "Document Distribution": "Approved documents are distributed to relevant departments and made accessible in the document management system.",
      "Document Revision": "Changes to existing documents follow the same process as new documents. Changes must be clearly identified.",
      "Document Retention": "Documents must be retained according to legal and regulatory requirements, minimum 3 years."
    },
    references: {
      "ISO 9001:2015 Standard": "Section 7.5 - Documented Information",
      "Quality Manual": "Section 4.2 - Document Control",
      "Records Retention Policy": "QP-7.5-02"
    }
  },
  {
    title: 'Statistical Process Control Implementation',
    objective: 'To establish a standardized approach for implementing Statistical Process Control (SPC) in manufacturing processes.',
    scope: 'This procedure applies to all production processes within manufacturing facilities that require statistical monitoring.',
    responsibilities: {
      "Quality Engineer": "Design and implement SPC systems, analyze data and report findings",
      "Production Manager": "Ensure SPC procedures are followed on production lines",
      "Operators": "Collect data, monitor control charts, and respond to out-of-control conditions",
      "Quality Manager": "Provide resources and support for SPC implementation"
    },
    procedure: {
      "Process Selection": "Identify critical processes that would benefit from SPC implementation based on risk assessment.",
      "Variable Selection": "Determine which process variables are critical to quality and should be monitored.",
      "Data Collection Plan": "Establish sampling frequency, sample size, and data collection methods.",
      "Control Chart Selection": "Select appropriate control chart type based on data characteristics and process requirements.",
      "Control Limit Calculation": "Calculate control limits using at least 25 subgroups of data under normal operating conditions.",
      "Implementation": "Train operators, implement data collection, and display control charts at workstations.",
      "Monitoring": "Regular monitoring of control charts and documentation of process adjustments.",
      "Response Plan": "Define actions to be taken when processes show out-of-control conditions."
    },
    references: {
      "Quality Control Handbook": "Section 5 - Statistical Process Control",
      "AIAG SPC Manual": "2nd Edition",
      "Internal Training Material": "SPC-TRN-001"
    }
  },
  {
    title: 'Process Capability Analysis Procedure',
    objective: 'To establish a standard method for conducting process capability studies to determine if processes meet quality requirements.',
    scope: 'This procedure applies to all manufacturing processes where conformance to specification limits is critical.',
    responsibilities: {
      "Quality Engineer": "Conduct capability studies and analyze results",
      "Production Supervisor": "Ensure consistent process operation during studies",
      "Quality Manager": "Review and approve capability reports",
      "Process Engineer": "Implement process improvements based on capability results"
    },
    procedure: {
      "Preparation": "Ensure process is stable and in statistical control before conducting capability analysis.",
      "Data Collection": "Collect at least 100 consecutive measurements under normal operating conditions.",
      "Normality Check": "Verify data follows normal distribution using appropriate statistical tests.",
      "Capability Calculation": "Calculate Cp, Cpk, Pp, and Ppk indices using approved statistical software.",
      "Interpretation": "Interpret results based on established criteria (Cpk > 1.33 for existing processes, Cpk > 1.67 for new processes).",
      "Reporting": "Document results in standard format including histograms, capability indices, and recommendations.",
      "Action Plan": "Develop improvement plans for processes with inadequate capability.",
      "Verification": "Verify effectiveness of improvements through follow-up capability studies."
    },
    references: {
      "AIAG SPC Manual": "Section 3 - Process Capability",
      "Quality Procedure": "QP-8.5-04 Process Improvement",
      "ISO/TS 16949": "Section 8.2.3.1 - Process Capability"
    }
  },
  {
    title: 'Quality Control Inspection Procedure',
    objective: 'To establish a standardized approach for conducting quality inspections on incoming materials, in-process products, and finished goods.',
    scope: 'This procedure applies to all quality inspection activities across manufacturing and assembly operations.',
    responsibilities: {
      "Quality Inspector": "Perform inspections according to established procedures and record results",
      "Quality Supervisor": "Schedule inspections and ensure proper implementation of procedures",
      "Materials Manager": "Ensure incoming materials are properly quarantined until inspection",
      "Production Manager": "Ensure access to products for in-process inspection"
    },
    procedure: {
      "Inspection Planning": "Determine inspection frequency, sample size, and acceptance criteria based on risk assessment.",
      "Incoming Inspection": "Inspect incoming materials according to approved inspection plans before release to production.",
      "In-Process Inspection": "Conduct inspections at critical process points to verify conformance to requirements.",
      "Final Inspection": "Verify finished products meet all specifications before release to shipping.",
      "Non-Conformance Handling": "Identify, segregate, and document non-conforming materials or products.",
      "Records Management": "Maintain inspection records according to document retention policies.",
      "Calibration Verification": "Verify all measurement equipment is properly calibrated before use."
    },
    references: {
      "ISO 9001:2015": "Section 8.6 - Release of Products and Services",
      "Quality Manual": "Section 8.0 - Measurement, Analysis and Improvement",
      "Sampling Procedure": "QP-8.6-01 Acceptance Sampling"
    }
  },
  {
    title: 'Advanced Statistical Analysis Procedure',
    objective: 'To establish standardized methods for applying advanced statistical techniques in quality engineering and process improvement.',
    scope: 'This procedure applies to all advanced statistical analysis activities including DOE, regression analysis, and reliability studies.',
    responsibilities: {
      "Statistical Analyst": "Design studies, analyze data and prepare reports",
      "Quality Engineer": "Identify opportunities for statistical analysis and implement findings",
      "Process Engineer": "Support study implementation and process modifications",
      "Quality Manager": "Approve study plans and resource allocation"
    },
    procedure: {
      "Study Design": "Define clear objectives, determine appropriate statistical methods, and design data collection plan.",
      "Design of Experiments": "For DOE studies, identify factors, levels, and appropriate experimental design (factorial, fractional factorial, etc.).",
      "Data Collection": "Ensure data collection follows the established plan and maintains data integrity.",
      "Data Analysis": "Analyze data using appropriate statistical methods and software tools.",
      "Interpretation": "Interpret results in context of process knowledge and business objectives.",
      "Reporting": "Document methodology, analysis, results, and recommendations in standard format.",
      "Implementation": "Develop action plans based on statistical findings.",
      "Verification": "Verify effectiveness of implemented changes through follow-up studies."
    },
    references: {
      "Quality Engineering Handbook": "Chapter 8 - Advanced Statistical Methods",
      "DOE Handbook": "NIST/SEMATECH e-Handbook of Statistical Methods",
      "Statistical Procedures": "QP-10.2-03 Statistical Techniques"
    }
  }
];

// Function to seed all the default SOPs
export async function seedDefaultSOPs() {
  try {
    console.log('Starting to seed default SOPs...');
    
    // Check if SOPs already exist
    const existingSOPs = await storage.getAllSOPs();
    
    if (existingSOPs.length > 0) {
      console.log(`${existingSOPs.length} SOPs already exist, skipping SOP creation`);
      return;
    }
    
    // Create all default SOPs
    for (const sopData of defaultSOPs) {
      console.log(`Creating SOP: ${sopData.title}`);
      await storage.createSOP(sopData);
    }
    
    console.log('Default SOPs seeded successfully');
  } catch (error) {
    console.error('Error seeding default SOPs:', error);
  }
}
