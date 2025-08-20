/**
 * Validation Manager - TypeScript版
 * バリデーション処理管理
 */

// 型定義
interface ValidationOptions {
    min?: number;
    max?: number;
    integer?: boolean;
    step?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
}

interface ValidationResult {
    isValid: boolean;
    error?: string;
    value?: any;
}

interface ValidationRule {
    name: string;
    validator: ValidatorFunction;
    message: string;
    priority?: number;
    options?: ValidationOptions;
}

type ValidatorFunction = (value: any, options?: ValidationOptions) => boolean;

interface IServiceContainer {
    register<T>(name: string, factory: any, singleton?: boolean): IServiceContainer;
    get<T>(name: string): T;
    has(name: string): boolean;
    resolve(dependencies: Record<string, string>): Record<string, any>;
    initializeAll(serviceNames: string[]): Promise<void>;
    getRegisteredServices(): string[];
}

interface ValidationAppConfig {
    VALIDATION?: {
        MIN_DPI?: number;
        MAX_DPI?: number;
        MIN_SENSI?: number;
        MAX_SENSI?: number;
    };
}

interface FieldValidationInfo {
    rules: string[];
    lastValidation?: ValidationResult;
    element?: HTMLElement;
}

class ValidationManager extends BaseManager {
    private validators = new Map<string, ValidatorFunction>();
    private rules = new Map<string, ValidationRule>();
    private errorMessages = new Map<string, string>();
    private fieldValidations = new Map<string, FieldValidationInfo>();
    private eventHandlersSetup: boolean = false;

    constructor(config: any = {}, container: IServiceContainer | null = null) {
        super(config, container);
        
        this.setupDefaultValidators();
        this.setupDefaultRules();
        this.setupDefaultMessages();
    }

    /**
     * 初期化処理
     */
    protected async doInit(): Promise<void> {
        this.log('ValidationManager initialized', 'info');
    }

    /**
     * デフォルトバリデーターの設定
     */
    private setupDefaultValidators(): void {
        // 数値バリデーター
        this.validators.set('number', (value: any, options: ValidationOptions = {}): boolean => {
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            
            if (options.min !== undefined && num < options.min) return false;
            if (options.max !== undefined && num > options.max) return false;
            if (options.integer && !Number.isInteger(num)) return false;
            
            return true;
        });

        // 必須バリデーター
        this.validators.set('required', (value: any): boolean => {
            return value !== null && value !== undefined && value !== '';
        });

        // 範囲バリデーター
        this.validators.set('range', (value: any, options: ValidationOptions = {}): boolean => {
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            
            const min = options.min ?? -Infinity;
            const max = options.max ?? Infinity;
            
            return num >= min && num <= max;
        });

        // 文字列長バリデーター
        this.validators.set('length', (value: any, options: ValidationOptions = {}): boolean => {
            const str = String(value);
            const min = options.min ?? 0;
            const max = options.max ?? Infinity;
            
            return str.length >= min && str.length <= max;
        });

        // パターンバリデーター
        this.validators.set('pattern', (value: any, options: ValidationOptions = {}): boolean => {
            if (!options.pattern) return true;
            return options.pattern.test(String(value));
        });

        // ステップバリデーター
        this.validators.set('step', (value: any, options: ValidationOptions = {}): boolean => {
            const num = parseFloat(value);
            if (isNaN(num) || !options.step) return true;
            
            const remainder = num % options.step;
            return Math.abs(remainder) < 1e-10 || Math.abs(remainder - options.step) < 1e-10;
        });

        // カスタムバリデーター
        this.validators.set('custom', (value: any, options: ValidationOptions = {}): boolean => {
            return options.custom ? options.custom(value) : true;
        });

        this.log('Default validators setup completed', 'debug');
    }

    /**
     * デフォルトルールの設定
     */
    private setupDefaultRules(): void {
        // DPI バリデーション
        this.rules.set('dpi', {
            name: 'dpi',
            validator: this.validators.get('range')!,
            message: 'DPIは{min}から{max}の間で入力してください',
            priority: 1,
            options: {
                min: this.getConfig<number>('VALIDATION.MIN_DPI', 400),
                max: this.getConfig<number>('VALIDATION.MAX_DPI', 50000)
            }
        });

        // 感度バリデーション
        this.rules.set('sensitivity', {
            name: 'sensitivity',
            validator: this.validators.get('range')!,
            message: '感度は{min}から{max}の間で入力してください',
            priority: 1,
            options: {
                min: this.getConfig<number>('VALIDATION.MIN_SENSI', 0.1),
                max: this.getConfig<number>('VALIDATION.MAX_SENSI', 5.0)
            }
        });

        // 必須フィールド
        this.rules.set('required', {
            name: 'required',
            validator: this.validators.get('required')!,
            message: 'この項目は必須です',
            priority: 0
        });

        // 正数バリデーション
        this.rules.set('positive', {
            name: 'positive',
            validator: this.validators.get('range')!,
            message: '正の数値を入力してください',
            priority: 1,
            options: { min: 0.001 }
        });

        this.log('Default rules setup completed', 'debug');
    }

    /**
     * デフォルトエラーメッセージの設定
     */
    private setupDefaultMessages(): void {
        this.errorMessages.set('number', '有効な数値を入力してください');
        this.errorMessages.set('required', 'この項目は必須です');
        this.errorMessages.set('range', '値が範囲外です');
        this.errorMessages.set('length', '文字数が不正です');
        this.errorMessages.set('pattern', '形式が正しくありません');
        this.errorMessages.set('step', 'ステップ値に合いません');
        this.errorMessages.set('custom', 'バリデーションエラー');

        this.log('Default error messages setup completed', 'debug');
    }

    /**
     * DPI値のバリデーション
     */
    public validateDPI(value: number): ValidationResult {
        const rule = this.rules.get('dpi');
        if (!rule) {
            return { isValid: false, error: 'DPI validation rule not found' };
        }

        const isValid = rule.validator(value, rule.options);
        if (!isValid) {
            const message = this.formatErrorMessage(rule.message, rule.options || {});
            return { isValid: false, error: message, value };
        }

        return { isValid: true, value };
    }

    /**
     * 感度値のバリデーション
     */
    public validateSensitivity(value: number): ValidationResult {
        const rule = this.rules.get('sensitivity');
        if (!rule) {
            return { isValid: false, error: 'Sensitivity validation rule not found' };
        }

        const isValid = rule.validator(value, rule.options);
        if (!isValid) {
            const message = this.formatErrorMessage(rule.message, rule.options || {});
            return { isValid: false, error: message, value };
        }

        return { isValid: true, value };
    }

    /**
     * フィールドの汎用バリデーション
     */
    public validateField(fieldName: string, value: any, ruleNames?: string[]): ValidationResult {
        const rules = ruleNames || this.getFieldRules(fieldName);
        
        for (const ruleName of rules) {
            const rule = this.rules.get(ruleName);
            if (!rule) {
                this.log(`Validation rule not found: ${ruleName}`, 'warn');
                continue;
            }

            const isValid = rule.validator(value, rule.options);
            if (!isValid) {
                const message = this.formatErrorMessage(rule.message, rule.options || {});
                const result: ValidationResult = { isValid: false, error: message, value };
                
                // フィールド情報を更新
                this.updateFieldValidation(fieldName, result);
                return result;
            }
        }

        const result: ValidationResult = { isValid: true, value };
        this.updateFieldValidation(fieldName, result);
        return result;
    }

    /**
     * 複数値の一括バリデーション
     */
    public validateMultiple(
        fields: Record<string, { value: any; rules?: string[] }>
    ): Record<string, ValidationResult> {
        const results: Record<string, ValidationResult> = {};
        
        for (const [fieldName, fieldData] of Object.entries(fields)) {
            results[fieldName] = this.validateField(fieldName, fieldData.value, fieldData.rules);
        }
        
        return results;
    }

    /**
     * バリデーションルールの追加
     */
    public addRule(name: string, rule: ValidationRule): void {
        this.rules.set(name, rule);
        this.log(`Validation rule added: ${name}`, 'debug');
    }

    /**
     * バリデーションルールの削除
     */
    public removeRule(name: string): void {
        this.rules.delete(name);
        this.log(`Validation rule removed: ${name}`, 'debug');
    }

    /**
     * カスタムバリデーターの追加
     */
    public addValidator(name: string, validator: ValidatorFunction): void {
        this.validators.set(name, validator);
        this.log(`Custom validator added: ${name}`, 'debug');
    }

    /**
     * フィールドのルール設定
     */
    public setFieldRules(fieldName: string, ruleNames: string[]): void {
        if (!this.fieldValidations.has(fieldName)) {
            this.fieldValidations.set(fieldName, { rules: [] });
        }
        
        const fieldInfo = this.fieldValidations.get(fieldName)!;
        fieldInfo.rules = ruleNames;
        
        this.log(`Field rules set for ${fieldName}: ${ruleNames.join(', ')}`, 'debug');
    }

    /**
     * フィールドのルール取得
     */
    private getFieldRules(fieldName: string): string[] {
        const fieldInfo = this.fieldValidations.get(fieldName);
        if (fieldInfo) {
            return fieldInfo.rules;
        }

        // デフォルトルールの推定
        if (fieldName.toLowerCase().includes('dpi')) {
            return ['required', 'dpi'];
        } else if (fieldName.toLowerCase().includes('sens')) {
            return ['required', 'sensitivity'];
        }
        
        return ['required'];
    }

    /**
     * フィールドバリデーション情報の更新
     */
    private updateFieldValidation(fieldName: string, result: ValidationResult): void {
        if (!this.fieldValidations.has(fieldName)) {
            this.fieldValidations.set(fieldName, { rules: [] });
        }
        
        const fieldInfo = this.fieldValidations.get(fieldName)!;
        fieldInfo.lastValidation = result;
    }

    /**
     * エラーメッセージのフォーマット
     */
    private formatErrorMessage(template: string, options: ValidationOptions): string {
        let message = template;
        
        if (options.min !== undefined) {
            message = message.replace('{min}', options.min.toString());
        }
        if (options.max !== undefined) {
            message = message.replace('{max}', options.max.toString());
        }
        
        return message;
    }

    /**
     * フィールドの最後のバリデーション結果取得
     */
    public getLastValidation(fieldName: string): ValidationResult | null {
        const fieldInfo = this.fieldValidations.get(fieldName);
        return fieldInfo?.lastValidation || null;
    }

    /**
     * 全フィールドのバリデーション状態取得
     */
    public getAllValidationStates(): Record<string, ValidationResult | null> {
        const states: Record<string, ValidationResult | null> = {};
        
        for (const [fieldName, fieldInfo] of this.fieldValidations.entries()) {
            states[fieldName] = fieldInfo.lastValidation || null;
        }
        
        return states;
    }

    /**
     * バリデーション状態のクリア
     */
    public clearValidation(fieldName?: string): void {
        if (fieldName) {
            const fieldInfo = this.fieldValidations.get(fieldName);
            if (fieldInfo) {
                delete fieldInfo.lastValidation;
            }
        } else {
            for (const fieldInfo of this.fieldValidations.values()) {
                delete fieldInfo.lastValidation;
            }
        }
        
        this.log(`Validation cleared for ${fieldName || 'all fields'}`, 'debug');
    }

    /**
     * バリデーションエラーの視覚的表示
     */
    public showFieldError(fieldName: string, message: string): void {
        const element = document.getElementById(fieldName) || 
                      document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
        
        if (!element) {
            this.log(`Element not found for field: ${fieldName}`, 'warn');
            return;
        }

        // エラークラスの追加
        element.classList.add('validation-error');
        
        // エラーメッセージの表示
        this.showErrorMessage(element, message);
    }

    /**
     * バリデーションエラーの視覚的クリア
     */
    public clearFieldError(fieldName: string): void {
        const element = document.getElementById(fieldName) || 
                      document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
        
        if (!element) return;

        element.classList.remove('validation-error');
        this.removeErrorMessage(element);
    }

    /**
     * エラーメッセージの表示
     */
    private showErrorMessage(element: HTMLElement, message: string): void {
        this.removeErrorMessage(element);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error-message';
        errorDiv.textContent = message;
        errorDiv.setAttribute('role', 'alert');
        
        element.parentNode?.insertBefore(errorDiv, element.nextSibling);
    }

    /**
     * エラーメッセージの削除
     */
    private removeErrorMessage(element: HTMLElement): void {
        const nextElement = element.nextElementSibling;
        if (nextElement && nextElement.classList.contains('validation-error-message')) {
            nextElement.remove();
        }
    }

    /**
     * 利用可能なバリデーター一覧取得
     */
    public getAvailableValidators(): string[] {
        return Array.from(this.validators.keys());
    }

    /**
     * 利用可能なルール一覧取得
     */
    public getAvailableRules(): string[] {
        return Array.from(this.rules.keys());
    }

    /**
     * クリーンアップ処理
     */
    public destroy(): void {
        this.validators.clear();
        this.rules.clear();
        this.errorMessages.clear();
        this.fieldValidations.clear();
        
        // エラーメッセージ要素の削除
        const errorMessages = document.querySelectorAll('.validation-error-message');
        errorMessages.forEach(msg => msg.remove());
        
        // エラークラスの削除
        const errorElements = document.querySelectorAll('.validation-error');
        errorElements.forEach(el => el.classList.remove('validation-error'));

        super.destroy();
        this.log('ValidationManager destroyed', 'info');
    }
}

// Export for both ES6 modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ValidationManager };
} else if (typeof window !== 'undefined') {
    (window as any).ValidationManager = ValidationManager;
}
