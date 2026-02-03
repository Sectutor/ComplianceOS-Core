
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Input } from "@complianceos/ui/ui/input";
import { Button } from "@complianceos/ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Trash, Plus } from "lucide-react";
import { Checkbox } from "@complianceos/ui/ui/checkbox";

export interface Question {
    id: string;
    text: string;
    type: string;
    required: boolean;
}

export interface Section {
    title: string;
    description?: string;
    questions: Question[];
}

interface QuestionTableProps {
    sections: Section[];
    onChange: (sections: Section[]) => void;
}

export function QuestionTable({ sections, onChange }: QuestionTableProps) {
    const updateQuestion = (sectionIndex: number, questionIndex: number, field: keyof Question, value: any) => {
        const newSections = [...sections];
        newSections[sectionIndex].questions[questionIndex] = {
            ...newSections[sectionIndex].questions[questionIndex],
            [field]: value
        };
        onChange(newSections);
    };

    const removeQuestion = (sectionIndex: number, questionIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].questions.splice(questionIndex, 1);
        onChange(newSections);
    };

    const addQuestion = (sectionIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].questions.push({
            id: `q_${Date.now()}`,
            text: "",
            type: "yes_no",
            required: true
        });
        onChange(newSections);
    };

    const updateSectionTitle = (index: number, title: string) => {
        const newSections = [...sections];
        newSections[index].title = title;
        onChange(newSections);
    };

    const addSection = () => {
        onChange([...sections, { title: "New Section", questions: [] }]);
    };

    const removeSection = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        onChange(newSections);
    };

    return (
        <div className="space-y-8">
            {sections.map((section, sIdx) => (
                <div key={sIdx} className="border rounded-lg p-4 bg-slate-50">
                    <div className="flex items-center gap-4 mb-4">
                        <Input 
                            value={section.title} 
                            onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                            className="font-bold text-lg border-transparent hover:border-input focus:border-input w-full md:w-1/2"
                            placeholder="Section Title"
                        />
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => removeSection(sIdx)} className="text-destructive hover:bg-destructive/10">
                            Remove Section
                        </Button>
                    </div>

                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Question Text</TableHead>
                                    <TableHead className="w-[150px]">Type</TableHead>
                                    <TableHead className="w-[80px]">Req.</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {section.questions.map((q, qIdx) => (
                                    <TableRow key={`${sIdx}-${qIdx}`}>
                                        <TableCell>
                                            <Input 
                                                value={q.id} 
                                                onChange={(e) => updateQuestion(sIdx, qIdx, 'id', e.target.value)}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={q.text} 
                                                onChange={(e) => updateQuestion(sIdx, qIdx, 'text', e.target.value)}
                                                className="h-8"
                                                placeholder="Enter question..."
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select value={q.type} onValueChange={(val) => updateQuestion(sIdx, qIdx, 'type', val)}>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yes_no">Yes/No</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="file_upload">File Upload</SelectItem>
                                                    <SelectItem value="multiple_choice">Multi-Choice</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Checkbox 
                                                checked={q.required} 
                                                onCheckedChange={(checked) => updateQuestion(sIdx, qIdx, 'required', !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(sIdx, qIdx)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => addQuestion(sIdx)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                </div>
            ))}
            
            <Button className="w-full border-dashed" variant="outline" onClick={addSection}>
                <Plus className="mr-2 h-4 w-4" /> Add New Section
            </Button>
        </div>
    );
}
