import { Regulation } from "./types";

export const gdpr: Regulation = {
    id: "gdpr",
    name: "GDPR",
    description: "The General Data Protection Regulation (Regulation (EU) 2016/679) is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area.",
    type: "Privacy",
    logo: "/frameworks/gdpr.svg",
    articles: [
        // Chapter 1: General provisions
        {
            id: "gdpr-art-1",
            numericId: "1",
            title: "Subject-matter and objectives",
            description: "1. This Regulation lays down rules relating to the protection of natural persons with regard to the processing of personal data and rules relating to the free movement of personal data. 2. This Regulation protects fundamental rights and freedoms of natural persons and in particular their right to the protection of personal data. 3. The free movement of personal data within the Union shall be neither restricted nor prohibited for reasons connected with the protection of natural persons with regard to the processing of personal data."
        },
        {
            id: "gdpr-art-2",
            numericId: "2",
            title: "Material scope",
            description: "This Regulation applies to the processing of personal data wholly or partly by automated means and to the processing other than by automated means of personal data which form part of a filing system or are intended to form part of a filing system. It does not apply to processing by an individual for purely personal activities."
        },
        {
            id: "gdpr-art-3",
            numericId: "3",
            title: "Territorial scope",
            description: "1. This Regulation applies to the processing of personal data in the context of the activities of an establishment of a controller or a processor in the Union, regardless of whether the processing takes place in the Union or not. 2. This Regulation applies to the processing of personal data of data subjects who are in the Union by a controller or processor not established in the Union, where the processing activities are related to: (a) the offering of goods or services... (b) the monitoring of their behaviour."
        },
        {
            id: "gdpr-art-4",
            numericId: "4",
            title: "Definitions",
            description: "For the purposes of this Regulation: (1) 'personal data' means any information relating to an identified or identifiable natural person... (2) 'processing' means any operation or set of operations which is performed on personal data... (7) 'controller' means the natural or legal person... (8) 'processor' means a natural or legal person..."
        },
        // Chapter 2: Principles
        {
            id: "gdpr-art-5",
            numericId: "5",
            title: "Principles relating to processing of personal data",
            description: "1. Personal data shall be: (a) processed lawfully, fairly and in a transparent manner... (b) collected for specified, explicit and legitimate purposes... (c) adequate, relevant and limited to what is necessary... (d) accurate and, where necessary, kept up to date... (e) kept in a form which permits identification... (f) processed in a manner that ensures appropriate security...",
            subArticles: [
                { id: "art-5-1-a", title: "Lawfulness, fairness and transparency", description: "Processed lawfully, fairly and in a transparent manner." },
                { id: "art-5-1-b", title: "Purpose limitation", description: "Collected for specified, explicit and legitimate purposes." },
                { id: "art-5-1-c", title: "Data minimization", description: "Adequate, relevant and limited to what is necessary." },
                { id: "art-5-1-d", title: "Accuracy", description: "Accurate and, where necessary, kept up to date." },
                { id: "art-5-1-e", title: "Storage limitation", description: "Kept in a form which permits identification for no longer than is necessary." },
                { id: "art-5-1-f", title: "Integrity and confidentiality", description: "Processed in a manner that ensures appropriate security." }
            ],
            mappedControls: { "NIST 800-53": ["AC-1", "AT-1"], "ISO 27001": ["A.9.1.1", "A.7.2.2"] }
        },
        {
            id: "gdpr-art-6",
            numericId: "6",
            title: "Lawfulness of processing",
            description: "1. Processing shall be lawful only if and to the extent that at least one of the following applies: (a) the data subject has given consent... (b) processing is necessary for the performance of a contract... (c) processing is necessary for compliance with a legal obligation... (d) processing is necessary in order to protect the vital interests... (e) processing is necessary for the performance of a task carried out in the public interest... (f) processing is necessary for the purposes of the legitimate interests pursued by the controller...",
            mappedControls: { "NIST 800-53": ["AC-2"], "ISO 27001": ["A.9.2.1"] }
        },
        {
            id: "gdpr-art-7",
            numericId: "7",
            title: "Conditions for consent",
            description: "1. Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented. 2. If the data subject's consent is given in the context of a written declaration which also concerns other matters, the request for consent shall be presented in a manner which is clearly distinguishable..."
        },
        {
            id: "gdpr-art-8",
            numericId: "8",
            title: "Conditions applicable to child's consent in relation to information society services",
            description: "1. Where point (a) of Article 6(1) applies, in relation to the offer of information society services directly to a child, the processing of the personal data of a child shall be lawful where the child is at least 16 years old...",
            mappedControls: { "NIST 800-53": ["IA-8"], "ISO 27001": ["A.9.4.2"] }
        },
        {
            id: "gdpr-art-9",
            numericId: "9",
            title: "Processing of special categories of personal data",
            description: "1. Processing of personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, or trade union membership, and the processing of genetic data, biometric data... data concerning health or data concerning a natural person's sex life or sexual orientation shall be prohibited. 2. Paragraph 1 shall not apply if one of the following applies...",
            mappedControls: { "NIST 800-53": ["AC-3", "MP-4"], "ISO 27001": ["A.9.4.1", "A.8.3.1"] }
        },
        {
            id: "gdpr-art-10",
            numericId: "10",
            title: "Processing of personal data relating to criminal convictions and offences",
            description: "Processing of personal data relating to criminal convictions and offences or related security measures based on Article 6(1) shall be carried out only under the control of official authority..."
        },
        {
            id: "gdpr-art-11",
            numericId: "11",
            title: "Processing which does not require identification",
            description: "1. If the purposes for which a controller processes personal data do not or do no longer require the identification of a data subject by the controller, the controller shall not be obliged to maintain, acquire or process additional information..."
        },
        // Chapter 3: Rights of the data subject
        {
            id: "gdpr-art-12",
            numericId: "12",
            title: "Transparent information, communication and modalities for the exercise of the rights of the data subject",
            description: "1. The controller shall take appropriate measures to provide any information referred to in Articles 13 and 14 and any communication under Articles 15 to 22 and 34 relating to processing to the data subject in a concise, transparent, intelligible and easily accessible form...",
            mappedControls: { "NIST 800-53": ["AT-2"], "ISO 27001": ["A.7.2.2"] }
        },
        {
            id: "gdpr-art-13",
            numericId: "13",
            title: "Information to be provided where personal data are collected from the data subject",
            description: "1. Where personal data relating to a data subject are collected from the data subject, the controller shall, at the time when personal data are obtained, provide the data subject with all of the following information..."
        },
        {
            id: "gdpr-art-14",
            numericId: "14",
            title: "Information to be provided where personal data have not been obtained from the data subject",
            description: "1. Where personal data have not been obtained from the data subject, the controller shall provide the data subject with the following information...",
            mappedControls: { "NIST 800-53": ["PT-5"], "ISO 27001": ["A.18.1.4"] }
        },
        {
            id: "gdpr-art-15",
            numericId: "15",
            title: "Right of access by the data subject",
            description: "1. The data subject shall have the right to obtain from the controller confirmation as to whether or not personal data concerning him or her are being processed, and, where that is the case, access to the personal data...",
            mappedControls: { "NIST 800-53": ["AC-1", "AC-2"], "ISO 27001": ["A.9.2.1", "A.9.2.2"] }
        },
        {
            id: "gdpr-art-16",
            numericId: "16",
            title: "Right to rectification",
            description: "The data subject shall have the right to obtain from the controller without undue delay the rectification of inaccurate personal data concerning him or her."
        },
        {
            id: "gdpr-art-17",
            numericId: "17",
            title: "Right to erasure ('right to be forgotten')",
            description: "1. The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay and the controller shall have the obligation to erase personal data without undue delay where one of the following grounds applies...",
            mappedControls: { "NIST 800-53": ["SI-4"], "ISO 27001": ["A.12.4.1"] }
        },
        {
            id: "gdpr-art-18",
            numericId: "18",
            title: "Right to restriction of processing",
            description: "1. The data subject shall have the right to obtain from the controller restriction of processing where one of the following applies..."
        },
        {
            id: "gdpr-art-19",
            numericId: "19",
            title: "Notification obligation regarding rectification or erasure of personal data or restriction of processing",
            description: "The controller shall communicate any rectification or erasure of personal data or restriction of processing carried out in accordance with Article 16, Article 17(1) and Article 18 to each recipient to whom the personal data have been disclosed..."
        },
        {
            id: "gdpr-art-20",
            numericId: "20",
            title: "Right to data portability",
            description: "1. The data subject shall have the right to receive the personal data concerning him or her, which he or she has provided to a controller, in a structured, commonly used and machine-readable format..."
        },
        {
            id: "gdpr-art-21",
            numericId: "21",
            title: "Right to object",
            description: "1. The data subject shall have the right to object, on grounds relating to his or her particular situation, at any time to processing of personal data concerning him or her which is based on point (e) or (f) of Article 6(1)..."
        },
        {
            id: "gdpr-art-22",
            numericId: "22",
            title: "Automated individual decision-making, including profiling",
            description: "1. The data subject shall have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning him or her or similarly significantly affects him or her."
        },
        {
            id: "gdpr-art-23",
            numericId: "23",
            title: "Restrictions",
            description: "1. Union or Member State law to which the data controller or processor is subject may restrict by way of a legislative measure the scope of the obligations and rights provided for in Articles 12 to 22..."
        },
        // Chapter 4: Controller and processor
        {
            id: "gdpr-art-24",
            numericId: "24",
            title: "Responsibility of the controller",
            description: "1. Taking into account the nature, scope, context and purposes of processing as well as the risks of varying likelihood and severity for the rights and freedoms of natural persons, the controller shall implement appropriate technical and organisational measures...",
            mappedControls: { "NIST 800-53": ["CA-1", "CA-2"], "ISO 27001": ["A.14.2.8"] }
        },
        {
            id: "gdpr-art-25",
            numericId: "25",
            title: "Data protection by design and by default",
            description: "1. Taking into account the state of the art, the cost of implementation and the nature, scope, context and purposes of processing... the controller shall, both at the time of the determination of the means for processing and at the time of the processing itself, implement appropriate technical and organisational measures...",
            mappedControls: { "NIST 800-53": ["SA-8"], "ISO 27001": ["A.14.2.1"] }
        },
        {
            id: "gdpr-art-26",
            numericId: "26",
            title: "Joint controllers",
            description: "1. Where two or more controllers jointly determine the purposes and means of processing, they shall be joint controllers. They shall in a transparent manner determine their respective responsibilities..."
        },
        {
            id: "gdpr-art-27",
            numericId: "27",
            title: "Representatives of controllers or processors not established in the Union",
            description: "1. Where Article 3(2) applies, the controller or the processor shall designate in writing a representative in the Union."
        },
        {
            id: "gdpr-art-28",
            numericId: "28",
            title: "Processor",
            description: "1. Where processing is to be carried out on behalf of a controller, the controller shall use only processors providing sufficient guarantees to implement appropriate technical and organisational measures in such a manner that processing will meet the requirements of this Regulation...",
            mappedControls: { "NIST 800-53": ["SA-9", "CP-2"], "ISO 27001": ["A.15.2.1", "A.17.1.2"] }
        },
        {
            id: "gdpr-art-29",
            numericId: "29",
            title: "Processing under the authority of the controller or processor",
            description: "The processor and any person acting under the authority of the controller or of the processor, who has access to personal data, shall not process those data except on instructions from the controller, unless required to do so by Union or Member State law.",
            mappedControls: { "NIST 800-53": ["AC-6"], "ISO 27001": ["A.9.4.5"] }
        },
        {
            id: "gdpr-art-30",
            numericId: "30",
            title: "Records of processing activities",
            description: "Each controller and, where applicable, the controller's representative, shall maintain a record of processing activities under its responsibility.",
            subArticles: [
                { id: "art-30-1", title: "Controller Records", description: "Name/contact details, purposes, categories of data subjects, categories of recipients, transfers, time limits, security measures." }
            ],
            mappedControls: { "NIST 800-53": ["AU-3", "CM-8"], "ISO 27001": ["A.12.4.1", "A.8.1.1"] }
        },
        {
            id: "gdpr-art-31",
            numericId: "31",
            title: "Cooperation with the supervisory authority",
            description: "The controller and the processor and, where applicable, their representatives, shall cooperate, on request, with the supervisory authority in the performance of its tasks."
        },
        {
            id: "gdpr-art-32",
            numericId: "32",
            title: "Security of processing",
            description: "Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, the controller and the processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk.",
            mappedControls: { "NIST 800-53": ["AC-1", "AC-2", "AU-3", "SI-4", "SC-1", "SC-7"], "ISO 27001": ["A.9.2.1", "A.12.4.1", "A.13.1.1"] }
        },
        {
            id: "gdpr-art-33",
            numericId: "33",
            title: "Notification of a personal data breach to the supervisory authority",
            description: "In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority.",
            mappedControls: { "NIST 800-53": ["IR-6"], "ISO 27001": ["A.16.1.2"] }
        },
        {
            id: "gdpr-art-34",
            numericId: "34",
            title: "Communication of a personal data breach to the data subject",
            description: "When the personal data breach is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall communicate the personal data breach to the data subject without undue delay.",
            mappedControls: { "NIST 800-53": ["IR-6"], "ISO 27001": ["A.16.1.1"] }
        },
        {
            id: "gdpr-art-35",
            numericId: "35",
            title: "Data protection impact assessment",
            description: "1. Where a type of processing in particular using new technologies, and taking into account the nature, scope, context and purposes of the processing, is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall, prior to the processing, carry out an assessment of the impact...",
            mappedControls: { "NIST 800-53": ["RA-3"], "ISO 27001": ["A.12.6.1"] }
        },
        {
            id: "gdpr-art-36",
            numericId: "36",
            title: "Prior consultation",
            description: "1. The controller shall consult the supervisory authority prior to processing where a data protection impact assessment under Article 35 indicates that the processing would result in a high risk in the absence of measures taken by the controller to mitigate the risk.",
            mappedControls: { "NIST 800-53": ["RA-1"], "ISO 27001": ["A.8.2.1"] }
        },
        {
            id: "gdpr-art-37",
            numericId: "37",
            title: "Designation of the data protection officer",
            description: "The controller and the processor shall designate a data protection officer in any case where: (a) the processing is carried out by a public authority or body; (b) the core activities consist of processing operations which require regular and systematic monitoring of data subjects on a large scale; or (c) the core activities consist of processing on a large scale of special categories of data.",
            mappedControls: { "NIST 800-53": ["PM-1", "PS-1"], "ISO 27001": ["A.6.1.1", "A.7.2.1"] }
        },
        {
            id: "gdpr-art-38",
            numericId: "38",
            title: "Position of the data protection officer",
            description: "1. The controller and the processor shall ensure that the data protection officer is involved, properly and in a timely manner, in all issues which relate to the protection of personal data."
        },
        {
            id: "gdpr-art-39",
            numericId: "39",
            title: "Tasks of the data protection officer",
            description: "1. The data protection officer shall have at least the following tasks: (a) to inform and advise the controller... (b) to monitor compliance with this Regulation... (c) to provide advice where requested... (d) to cooperate with the supervisory authority...",
            mappedControls: { "NIST 800-53": ["PM-2"], "ISO 27001": ["A.6.1.1"] }
        },
        {
            id: "gdpr-art-40",
            numericId: "40",
            title: "Codes of conduct",
            description: "1. The Member States, the supervisory authorities, the Board and the Commission shall encourage the drawing up of codes of conduct intended to contribute to the proper application of this Regulation..."
        },
        {
            id: "gdpr-art-41",
            numericId: "41",
            title: "Monitoring of approved codes of conduct",
            description: "1. Without prejudice to the tasks and powers of the competent supervisory authority... the monitoring of compliance with a code of conduct pursuant to Article 40 may be carried out by a body which has an appropriate level of expertise..."
        },
        {
            id: "gdpr-art-42",
            numericId: "42",
            title: "Certification",
            description: "1. The Member States, the supervisory authorities, the Board and the Commission shall encourage, in particular at Union level, the establishment of data protection certification mechanisms and of data protection seals and marks..."
        },
        {
            id: "gdpr-art-43",
            numericId: "43",
            title: "Certification bodies",
            description: "1. Member States shall ensure that certification bodies which issue certification under Article 42(1) are accredited by one or both of the following..."
        },
        // Chapter 5: Transfers of personal data to third countries or international organisations
        {
            id: "gdpr-art-44",
            numericId: "44",
            title: "General principle for transfers",
            description: "Any transfer of personal data which are undergoing processing or are intended for processing after transfer to a third country or to an international organisation shall take place only if, subject to the other provisions of this Regulation, the conditions laid down in this Chapter are complied with by the controller and processor...",
            mappedControls: { "NIST 800-53": ["AC-20"], "ISO 27001": ["A.10.1.1"] }
        },
        {
            id: "gdpr-art-45",
            numericId: "45",
            title: "Transfers on the basis of an adequacy decision",
            description: "1. A transfer of personal data to a third country or an international organisation may take place where the Commission has decided that the third country, a territory or one or more specified sectors within that third country, or the international organisation in question ensures an adequate level of protection."
        },
        {
            id: "gdpr-art-46",
            numericId: "46",
            title: "Transfers subject to appropriate safeguards",
            description: "1. In the absence of a decision pursuant to Article 45(3), a controller or processor may transfer personal data to a third country or an international organisation only if the controller or processor has provided appropriate safeguards, and on condition that enforceable data subject rights and effective legal remedies for data subjects are available.",
            mappedControls: { "NIST 800-53": ["AC-20"], "ISO 27001": ["A.13.2.1"] }
        },
        {
            id: "gdpr-art-47",
            numericId: "47",
            title: "Binding corporate rules",
            description: "1. The competent supervisory authority shall approve binding corporate rules in accordance with the consistency mechanism set out in Article 63..."
        },
        {
            id: "gdpr-art-48",
            numericId: "48",
            title: "Transfers or disclosures not authorised by Union law",
            description: "Any judgment of a court or tribunal and any decision of an administrative authority of a third country requiring a controller or processor to transfer or disclose personal data may only be recognised or enforceable in any manner if based on an international agreement..."
        },
        {
            id: "gdpr-art-49",
            numericId: "49",
            title: "Derogations for specific situations",
            description: "1. In the absence of an adequacy decision pursuant to Article 45(3), or of appropriate safeguards pursuant to Article 46... a transfer or a set of transfers of personal data to a third country or an international organisation shall take place only on one of the following conditions..."
        },
        {
            id: "gdpr-art-50",
            numericId: "50",
            title: "International cooperation for the protection of personal data",
            description: "In relation to third countries and international organisations, the Commission and supervisory authorities shall take appropriate steps to... develop international cooperation mechanisms..."
        },
        // Chapter 6: Independent supervisory authorities
        {
            id: "gdpr-art-51",
            numericId: "51",
            title: "Supervisory authority",
            description: "1. Each Member State shall provide for one or more independent public authorities to be responsible for monitoring the application of this Regulation..."
        },
        {
            id: "gdpr-art-52",
            numericId: "52",
            title: "Independence",
            description: "1. Each supervisory authority shall act with complete independence in performing its tasks and exercising its powers in accordance with this Regulation."
        },
        {
            id: "gdpr-art-53",
            numericId: "53",
            title: "General conditions for the members of the supervisory authority",
            description: "1. Member States shall provide for each member of their supervisory authorities to be appointed by means of a transparent procedure by: (a) their parliament; (b) their government; (c) their head of State; or (d) an independent body entrusted with the appointment under Member State law."
        },
        {
            id: "gdpr-art-54",
            numericId: "54",
            title: "Rules on the establishment of the supervisory authority",
            description: "1. Each Member State shall provide by law for all of the following: (a) the establishment of each supervisory authority; (b) the qualifications and eligibility conditions required to be appointed as member of each supervisory authority..."
        },
        {
            id: "gdpr-art-55",
            numericId: "55",
            title: "Competence",
            description: "1. Each supervisory authority shall be competent for the performance of the tasks assigned to and the exercise of the powers conferred on it in accordance with this Regulation on the territory of its own Member State."
        },
        {
            id: "gdpr-art-56",
            numericId: "56",
            title: "Competence of the lead supervisory authority",
            description: "1. Without prejudice to Article 55, the supervisory authority of the main establishment or of the single establishment of the controller or processor shall be competent to act as lead supervisory authority for the cross-border processing carried out by that controller or processor..."
        },
        {
            id: "gdpr-art-57",
            numericId: "57",
            title: "Tasks",
            description: "1. Without prejudice to other tasks set out under this Regulation, each supervisory authority shall on its territory: (a) monitor and enforce the application of this Regulation; (b) promote public awareness and understanding of the risks, rules, safeguards and rights in relation to processing..."
        },
        {
            id: "gdpr-art-58",
            numericId: "58",
            title: "Powers",
            description: "1. Each supervisory authority shall have all of the following investigative powers: (a) to order the controller and the processor... to provide any information it requires for the performance of its tasks..."
        },
        {
            id: "gdpr-art-59",
            numericId: "59",
            title: "Activity reports",
            description: "Each supervisory authority shall draw up an annual report on its activities, which may include a list of types of infringements notified and types of measures taken..."
        },
        // Chapter 7: Cooperation and consistency
        {
            id: "gdpr-art-60",
            numericId: "60",
            title: "Cooperation between the lead supervisory authority and the other supervisory authorities concerned",
            description: "1. The lead supervisory authority shall cooperate with the other supervisory authorities concerned in accordance with this Article in an endeavour to reach consensus..."
        },
        {
            id: "gdpr-art-61",
            numericId: "61",
            title: "Mutual assistance",
            description: "1. Supervisory authorities shall provide each other with relevant information and mutual assistance in order to implement and apply this Regulation in a consistent manner..."
        },
        {
            id: "gdpr-art-62",
            numericId: "62",
            title: "Joint operations of supervisory authorities",
            description: "1. The supervisory authorities shall, where appropriate, conduct joint operations including joint investigations and joint enforcement measures in which members or staff of the supervisory authorities of other Member States are involved."
        },
        {
            id: "gdpr-art-63",
            numericId: "63",
            title: "Consistency mechanism",
            description: "In order to contribute to the consistent application of this Regulation throughout the Union, the supervisory authorities shall cooperate with each other and, where relevant, with the Commission, through the consistency mechanism as set out in this Section."
        },
        {
            id: "gdpr-art-64",
            numericId: "64",
            title: "Opinion of the Board",
            description: "1. The Board shall issue an opinion where a competent supervisory authority intends to adopt any of the measures below..."
        },
        {
            id: "gdpr-art-65",
            numericId: "65",
            title: "Dispute resolution by the Board",
            description: "1. In order to ensure the correct and consistent application of this Regulation in individual cases, the Board shall adopt a binding decision in the following cases..."
        },
        {
            id: "gdpr-art-66",
            numericId: "66",
            title: "Urgency procedure",
            description: "1. In exceptional circumstances, where a supervisory authority concerned considers that there is an urgent need to act in order to protect the rights and freedoms of data subjects, it may... immediately adopt provisional measures..."
        },
        {
            id: "gdpr-art-67",
            numericId: "67",
            title: "Exchange of information",
            description: "The Commission may adopt implementing acts of general scope in order to specify the arrangements for the exchange of information between supervisory authorities..."
        },
        {
            id: "gdpr-art-68",
            numericId: "68",
            title: "European Data Protection Board",
            description: "1. The European Data Protection Board (the 'Board') is hereby established as a body of the Union and shall have legal personality."
        },
        {
            id: "gdpr-art-69",
            numericId: "69",
            title: "Independence",
            description: "1. The Board shall act independently when performing its tasks or exercising its powers pursuant to Articles 70 and 71."
        },
        {
            id: "gdpr-art-70",
            numericId: "70",
            title: "Tasks of the Board",
            description: "1. The Board shall ensure the consistent application of this Regulation. To that end, the Board shall... (a) monitor and ensure the correct application of this Regulation..."
        },
        {
            id: "gdpr-art-71",
            numericId: "71",
            title: "Reports",
            description: "1. The Board shall draw up an annual report regarding the protection of natural persons with regard to processing in the Union and, where relevant, in third countries and international organisations."
        },
        {
            id: "gdpr-art-72",
            numericId: "72",
            title: "Procedure",
            description: "1. The Board shall take decisions by a simple majority of its members, unless otherwise provided for in this Regulation."
        },
        {
            id: "gdpr-art-73",
            numericId: "73",
            title: "Chair",
            description: "1. The Board shall elect a chair and two deputy chairs from amongst its members by simple majority."
        },
        {
            id: "gdpr-art-74",
            numericId: "74",
            title: "Tasks of the Chair",
            description: "1. The Chair shall have the following tasks: (a) to convene the meetings of the Board and prepare its agenda; (b) to notify decisions adopted by the Board..."
        },
        {
            id: "gdpr-art-75",
            numericId: "75",
            title: "Secretariat",
            description: "1. The Board shall have a secretariat, which shall be provided by the European Data Protection Supervisor."
        },
        {
            id: "gdpr-art-76",
            numericId: "76",
            title: "Confidentiality",
            description: "1. The discussions of the Board shall be confidential where the Board deems it necessary, as provided for in its rules of procedure."
        },
        // Chapter 8: Remedies, liability and penalties
        {
            id: "gdpr-art-77",
            numericId: "77",
            title: "Right to lodge a complaint with a supervisory authority",
            description: "1. Without prejudice to any other administrative or judicial remedy, every data subject shall have the right to lodge a complaint with a supervisory authority..."
        },
        {
            id: "gdpr-art-78",
            numericId: "78",
            title: "Right to an effective judicial remedy against a supervisory authority",
            description: "1. Without prejudice to any other administrative or non-judicial remedy, each natural or legal person shall have the right to an effective judicial remedy against a legally binding decision of a supervisory authority concerning them."
        },
        {
            id: "gdpr-art-79",
            numericId: "79",
            title: "Right to an effective judicial remedy against a controller or processor",
            description: "1. Without prejudice to any available administrative or non-judicial remedy, including the right to lodge a complaint with a supervisory authority pursuant to Article 77, each data subject shall have the right to an effective judicial remedy where he or she considers that his or her rights under this Regulation have been infringed..."
        },
        {
            id: "gdpr-art-80",
            numericId: "80",
            title: "Representation of data subjects",
            description: "1. The data subject shall have the right to mandate a not-for-profit body, organisation or association which has been properly constituted in accordance with the law of a Member State..."
        },
        {
            id: "gdpr-art-81",
            numericId: "81",
            title: "Suspension of proceedings",
            description: "1. Where a competent court of a Member State has information on proceedings, concerning the same subject matter as regards processing by the same controller or processor, that are pending in a court in another Member State, it shall contact that court in the other Member State to confirm the existence of such proceedings."
        },
        {
            id: "gdpr-art-82",
            numericId: "82",
            title: "Right to compensation and liability",
            description: "1. Any person who has suffered material or non-material damage as a result of an infringement of this Regulation shall have the right to receive compensation from the controller or processor for the damage suffered."
        },
        {
            id: "gdpr-art-83",
            numericId: "83",
            title: "General conditions for imposing administrative fines",
            description: "1. Each supervisory authority shall ensure that the imposition of administrative fines pursuant to this Article in respect of infringements of this Regulation referred to in paragraphs 4, 5 and 6 shall in each individual case be effective, proportionate and dissuasive."
        },
        {
            id: "gdpr-art-84",
            numericId: "84",
            title: "Penalties",
            description: "1. Member States shall lay down the rules on other penalties applicable to infringements of this Regulation in particular for infringements which are not subject to administrative fines pursuant to Article 83..."
        },
        // Chapter 9: Provisions relating to specific processing situations
        {
            id: "gdpr-art-85",
            numericId: "85",
            title: "Processing and freedom of expression and information",
            description: "1. Member States shall by law reconcile the right to the protection of personal data pursuant to this Regulation with the right to freedom of expression and information..."
        },
        {
            id: "gdpr-art-86",
            numericId: "86",
            title: "Processing and public access to official documents",
            description: "Personal data in official documents held by a public authority or a public body or a private body for the performance of a task carried out in the public interest may be disclosed by the authority or body in accordance with Union or Member State law..."
        },
        {
            id: "gdpr-art-87",
            numericId: "87",
            title: "Processing of the national identification number",
            description: "Member States may further determine the specific conditions for the processing of a national identification number or any other identifier of general application. In that case the national identification number or any other identifier of general application shall be used only under appropriate safeguards for the rights and freedoms of the data subject pursuant to this Regulation."
        },
        {
            id: "gdpr-art-88",
            numericId: "88",
            title: "Processing in the context of employment",
            description: "1. Member States may, by law or by collective agreements, provide for more specific rules to ensure the protection of the rights and freedoms in respect of the processing of personal data of employees in the employment context..."
        },
        {
            id: "gdpr-art-89",
            numericId: "89",
            title: "Safeguards and derogations relating to processing for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes",
            description: "1. Processing for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes, shall be subject to appropriate safeguards, in accordance with this Regulation, for the rights and freedoms of the data subject.",
            mappedControls: { "NIST 800-53": ["MP-6"], "ISO 27001": ["A.8.3.2"] }
        },
        {
            id: "gdpr-art-90",
            numericId: "90",
            title: "Obligations of secrecy",
            description: "1. Member States may adopt specific rules to set out the powers of the supervisory authorities laid down in Article 58(1)(e) and (f) in relation to controllers or processors that are subject, under Union or Member State law or rules established by national competent bodies, to an obligation of professional secrecy..."
        },
        {
            id: "gdpr-art-91",
            numericId: "91",
            title: "Existing data protection rules of churches and religious associations",
            description: "1. Where in a Member State, churches and religious associations or communities apply, at the time of entry into force of this Regulation, comprehensive rules relating to the protection of natural persons with regard to processing, such rules may continue to apply, provided that they are brought into line with this Regulation."
        },
        // Chapter 10: Delegated acts and implementing acts
        {
            id: "gdpr-art-92",
            numericId: "92",
            title: "Exercise of the delegation",
            description: "1. The power to adopt delegated acts is conferred on the Commission subject to the conditions laid down in this Article."
        },
        {
            id: "gdpr-art-93",
            numericId: "93",
            title: "Committee procedure",
            description: "1. The Commission shall be assisted by a committee. That committee shall be a committee within the meaning of Regulation (EU) No 182/2011."
        },
        // Chapter 11: Final provisions
        {
            id: "gdpr-art-94",
            numericId: "94",
            title: "Repeal of Directive 95/46/EC",
            description: "1. Directive 95/46/EC is repealed with effect from 25 May 2018. 2. References to the repealed Directive shall be construed as references to this Regulation."
        },
        {
            id: "gdpr-art-95",
            numericId: "95",
            title: "Relationship with Directive 2002/58/EC",
            description: "This Regulation shall not impose additional obligations on natural or legal persons in relation to processing in connection with the provision of publicly available electronic communications services in public communication networks in the Union in relation to matters for which they are subject to specific obligations with the same objective set out in Directive 2002/58/EC."
        },
        {
            id: "gdpr-art-96",
            numericId: "96",
            title: "Relationship with previously concluded agreements",
            description: "International agreements involving the transfer of personal data to third countries or international organisations which were concluded by Member States prior to 24 May 2016, and which comply with Union law as applicable prior to that date, shall remain in force until amended, replaced or revoked."
        },
        {
            id: "gdpr-art-97",
            numericId: "97",
            title: "Commission reports",
            description: "1. By 25 May 2020 and every four years thereafter, the Commission shall submit a report on the evaluation and review of this Regulation to the European Parliament and to the Council."
        },
        {
            id: "gdpr-art-98",
            numericId: "98",
            title: "Review of other Union legal acts on data protection",
            description: "The Commission shall, if appropriate, submit legislative proposals with a view to amending other Union legal acts on the protection of personal data, in order to ensure uniform and consistent protection of natural persons with regard to processing."
        },
        {
            id: "gdpr-art-99",
            numericId: "99",
            title: "Entry into force and application",
            description: "1. This Regulation shall enter into force on the twentieth day following that of its publication in the Official Journal of the European Union. 2. It shall apply from 25 May 2018."
        },

    ],
    questions: [
        {
            id: "q1",
            text: "Does your organization process the personal data of EU residents?",
            type: "boolean",
            relatedArticles: ["gdpr-art-2", "gdpr-art-3"]
        },
        {
            id: "q_ropa",
            text: "Do you maintain a Record of Processing Activities (RoPA) containing all data flows?",
            type: "boolean",
            relatedArticles: ["gdpr-art-30"]
        },
        {
            id: "q_dpo",
            text: "Have you appointed a Data Protection Officer (DPO) or determined you are exempt?",
            type: "boolean",
            relatedArticles: ["gdpr-art-37"]
        },
        {
            id: "q_access",
            text: "Do you have a process to respond to Data Subject Access Requests (DSARs) within 30 days?",
            type: "boolean",
            relatedArticles: ["gdpr-art-15"]
        },
        {
            id: "q_erasure",
            text: "Can your systems technicallly support the 'Right to be Forgotten' (permanent deletion)?",
            type: "boolean",
            relatedArticles: ["gdpr-art-17"]
        },
        {
            id: "q_breach",
            text: "Do you have a procedure to notify authorities of a breach within 72 hours?",
            type: "boolean",
            relatedArticles: ["gdpr-art-33"]
        },
        {
            id: "q_security",
            text: "How would you rate your technical security measures (encryption, access control)?",
            type: "scale",
            relatedArticles: ["gdpr-art-32"]
        }
    ]
};
