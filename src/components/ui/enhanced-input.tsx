import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { emailValidation, phoneValidation } from '@/lib/validation';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  validation?: 'email' | 'phone' | 'none';
  onValidationChange?: (isValid: boolean, error?: string) => void;
  showValidationIcon?: boolean;
  required?: boolean;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    label, 
    validation = 'none', 
    onValidationChange, 
    showValidationIcon = true,
    required = false,
    className,
    value,
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [validationState, setValidationState] = useState<{
      isValid: boolean;
      error?: string;
      touched: boolean;
    }>({ isValid: true, touched: false });

    const validateInput = (inputValue: string) => {
      if (!inputValue && required) {
        return { isValid: false, error: `${label || 'Field'} is required` };
      }
      
      if (!inputValue) {
        return { isValid: true };
      }

      switch (validation) {
        case 'email':
          return emailValidation.validate(inputValue);
        case 'phone':
          return phoneValidation.validate(inputValue);
        default:
          return { isValid: true };
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Format phone number as user types
      if (validation === 'phone') {
        inputValue = phoneValidation.format(inputValue);
      }
      
      const result = validateInput(inputValue);
      setValidationState({
        isValid: result.isValid,
        error: result.error,
        touched: validationState.touched
      });
      
      onValidationChange?.(result.isValid, result.error);
      
      // Call original onChange with formatted value
      if (onChange) {
        const event = { ...e, target: { ...e.target, value: inputValue } };
        onChange(event);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const result = validateInput(e.target.value);
      setValidationState({
        isValid: result.isValid,
        error: result.error,
        touched: true
      });
      
      onValidationChange?.(result.isValid, result.error);
      onBlur?.(e);
    };

    const getValidationIcon = () => {
      if (!showValidationIcon || !validationState.touched || !value) return null;
      
      if (validationState.isValid) {
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      } else {
        return <XCircle className="h-5 w-5 text-red-500" />;
      }
    };

    const getInputClassName = () => {
      if (!validationState.touched || !value) return className;
      
      return cn(
        className,
        validationState.isValid
          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
          : 'border-red-500 focus:border-red-500 focus:ring-red-500'
      );
    };

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
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getInputClassName()}
            {...props}
          />
          
          {showValidationIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {getValidationIcon()}
            </div>
          )}
        </div>
        
        {validationState.touched && !validationState.isValid && validationState.error && (
          <div className="flex items-center space-x-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{validationState.error}</span>
          </div>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export { EnhancedInput };