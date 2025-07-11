import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { passwordValidation } from '@/lib/validation';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onValidationChange?: (isValid: boolean, feedback: string[]) => void;
  showStrengthMeter?: boolean;
  required?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    label, 
    onValidationChange, 
    showStrengthMeter = true,
    required = false,
    className,
    value,
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [validationState, setValidationState] = useState<{
      isValid: boolean;
      score: number;
      feedback: string[];
      touched: boolean;
    }>({ isValid: true, score: 0, feedback: [], touched: false });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const result = passwordValidation.validate(inputValue);
      
      setValidationState({
        isValid: result.isValid,
        score: result.score,
        feedback: result.feedback,
        touched: validationState.touched
      });
      
      onValidationChange?.(result.isValid, result.feedback);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const result = passwordValidation.validate(e.target.value);
      setValidationState({
        isValid: result.isValid,
        score: result.score,
        feedback: result.feedback,
        touched: true
      });
      
      onValidationChange?.(result.isValid, result.feedback);
      onBlur?.(e);
    };

    const getStrengthColor = (score: number) => {
      if (score <= 1) return 'bg-red-500';
      if (score <= 2) return 'bg-orange-500';
      if (score <= 3) return 'bg-yellow-500';
      if (score <= 4) return 'bg-blue-500';
      return 'bg-green-500';
    };

    const getStrengthWidth = (score: number) => {
      return `${(score / 5) * 100}%`;
    };

    const { label: strengthLabel, color: strengthColor } = passwordValidation.getStrengthLabel(validationState.score);

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'pr-10',
              className,
              validationState.touched && value && (
                validationState.isValid
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  : 'border-red-500 focus:border-red-500 focus:ring-red-500'
              )
            )}
            {...props}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
        
        {showStrengthMeter && value && (
          <div className="space-y-2">
            {/* Strength bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  getStrengthColor(validationState.score)
                )}
                style={{ width: getStrengthWidth(validationState.score) }}
              />
            </div>
            
            {/* Strength label */}
            <div className="flex justify-between items-center text-sm">
              <span className={strengthColor}>
                Password strength: {strengthLabel}
              </span>
              {validationState.touched && value && (
                validationState.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )
              )}
            </div>
            
            {/* Feedback */}
            {validationState.touched && validationState.feedback.length > 0 && (
              <div className="space-y-1">
                {validationState.feedback.map((feedback, index) => (
                  <div key={index} className="flex items-center space-x-1 text-sm text-orange-600">
                    <span>•</span>
                    <span>{feedback}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };