import { invoiceTemplates, InvoiceTemplate } from '@/types/invoiceTemplates';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: InvoiceTemplate;
  onSelectTemplate: (template: InvoiceTemplate) => void;
}

const TemplateSelector = ({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  const handleChange = (templateId: string) => {
    const template = invoiceTemplates.find((t) => t.id === templateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Palette className="w-5 h-5 text-muted-foreground" />
      <Select value={selectedTemplate.id} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          {invoiceTemplates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{
                    background: template.headerBg.includes('gradient')
                      ? template.headerBg
                      : template.headerBg,
                  }}
                />
                {template.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TemplateSelector;
