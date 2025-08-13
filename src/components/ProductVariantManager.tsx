import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Package, Palette, Ruler } from "lucide-react";

interface ProductVariant {
  id: string;
  sku?: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  images?: string[];
  weight?: number;
}

interface VariantOptions {
  [key: string]: string[];
}

interface ProductVariantManagerProps {
  hasVariants: boolean;
  variants: ProductVariant[];
  variantOptions: VariantOptions;
  basePrice: number;
  onVariantsChange: (variants: ProductVariant[]) => void;
  onVariantOptionsChange: (options: VariantOptions) => void;
  onHasVariantsChange: (hasVariants: boolean) => void;
}

export const ProductVariantManager = ({
  hasVariants,
  variants,
  variantOptions,
  basePrice,
  onVariantsChange,
  onVariantOptionsChange,
  onHasVariantsChange,
}: ProductVariantManagerProps) => {
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState("");

  const addVariantOption = () => {
    if (!newAttributeName.trim() || !newAttributeValue.trim()) return;
    
    const updatedOptions = { ...variantOptions };
    if (!updatedOptions[newAttributeName]) {
      updatedOptions[newAttributeName] = [];
    }
    
    if (!updatedOptions[newAttributeName].includes(newAttributeValue)) {
      updatedOptions[newAttributeName].push(newAttributeValue);
      onVariantOptionsChange(updatedOptions);
    }
    
    setNewAttributeValue("");
    // Don't clear attribute name so user can keep adding values to same attribute
    if (Object.keys(variantOptions).length === 0 || !variantOptions[newAttributeName]) {
      setNewAttributeName("");
    }
  };

  const removeVariantOption = (attributeName: string, value: string) => {
    const updatedOptions = { ...variantOptions };
    updatedOptions[attributeName] = updatedOptions[attributeName].filter(v => v !== value);
    if (updatedOptions[attributeName].length === 0) {
      delete updatedOptions[attributeName];
    }
    onVariantOptionsChange(updatedOptions);
  };

  const generateVariants = () => {
    const attributeNames = Object.keys(variantOptions);
    if (attributeNames.length === 0) return;

    const combinations: Record<string, string>[] = [];
    
    const generateCombinations = (index: number, current: Record<string, string>) => {
      if (index === attributeNames.length) {
        combinations.push({ ...current });
        return;
      }
      
      const attributeName = attributeNames[index];
      const values = variantOptions[attributeName];
      
      for (const value of values) {
        current[attributeName] = value;
        generateCombinations(index + 1, current);
      }
    };
    
    generateCombinations(0, {});
    
    const newVariants: ProductVariant[] = combinations.map((attributes, index) => ({
      id: `variant_${Date.now()}_${index}`,
      attributes,
      price: basePrice,
      stock: 0,
    }));
    
    onVariantsChange(newVariants);
  };

  const updateVariant = (variantId: string, field: string, value: any) => {
    const updatedVariants = variants.map(variant => 
      variant.id === variantId 
        ? { ...variant, [field]: value }
        : variant
    );
    onVariantsChange(updatedVariants);
  };

  const removeVariant = (variantId: string) => {
    const updatedVariants = variants.filter(variant => variant.id !== variantId);
    onVariantsChange(updatedVariants);
  };

  const getVariantDisplayName = (variant: ProductVariant) => {
    return Object.entries(variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Variants
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Variants */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="has-variants" className="text-sm font-medium">
              This product has variants (color, size, style, etc.)
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable this if your product comes in different options
            </p>
          </div>
          <Switch
            id="has-variants"
            checked={hasVariants}
            onCheckedChange={onHasVariantsChange}
          />
        </div>

        {hasVariants && (
          <>
            {/* Variant Options Setup */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Variant Attributes</Label>
                <p className="text-sm text-muted-foreground">
                  Add attributes like color, size, style, etc.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Attribute name (e.g., Color, Size)"
                    value={newAttributeName}
                    onChange={(e) => setNewAttributeName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g., Red, Large)"
                    value={newAttributeValue}
                    onChange={(e) => setNewAttributeValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariantOption())}
                    className="flex-1"
                  />
                  <Button onClick={addVariantOption} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  💡 <strong>How to add variants:</strong>
                  <br />1. Enter attribute name (e.g., "Color") and first value (e.g., "Red")
                  <br />2. Click + to add it, then add more values to the same attribute
                  <br />3. Repeat for other attributes (Size, Style, etc.)
                  <br />4. Click "Generate All Variant Combinations" to create variants
                </div>
              </div>

              {/* Display Current Options */}
              {Object.keys(variantOptions).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(variantOptions).map(([attributeName, values]) => (
                    <div key={attributeName} className="space-y-2">
                      <Label className="text-sm font-medium capitalize">
                        {attributeName}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => (
                          <Badge key={value} variant="secondary" className="flex items-center gap-1">
                            {value}
                            <button
                              onClick={() => removeVariantOption(attributeName, value)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Generate Variants Button */}
              {Object.keys(variantOptions).length > 0 && (
                <Button onClick={generateVariants} variant="outline" className="w-full">
                  Generate All Variant Combinations
                </Button>
              )}
            </div>

            {/* Variant List */}
            {variants.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Variant Details</Label>
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <Card key={variant.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {getVariantDisplayName(variant)}
                          </h4>
                          <Button
                            onClick={() => removeVariant(variant.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">SKU (optional)</Label>
                            <Input
                              placeholder="SKU"
                              value={variant.sku || ""}
                              onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                              className="h-8"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs">Price (cents)</Label>
                            <Input
                              type="number"
                              placeholder="Price"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.id, "price", parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs">Stock Quantity</Label>
                            <Input
                              type="number"
                              placeholder="Stock"
                              value={variant.stock}
                              onChange={(e) => updateVariant(variant.id, "stock", parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};