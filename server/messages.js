// Error messages returned by the API, in English and Arabic.
const MESSAGES = {
  name_length: ['Name must be between 2 and 60 characters.', 'يجب أن يكون الاسم بين حرفين و60 حرفًا.'],
  email_invalid: ['Please enter a valid email address.', 'يُرجى إدخال بريد إلكتروني صحيح.'],
  password_short: ['Password must be at least 8 characters.', 'يجب ألا تقل كلمة المرور عن 8 أحرف.'],
  password_long: ['Password is too long.', 'كلمة المرور طويلة جدًا.'],
  email_taken_login: ['An account with this email already exists. Try logging in instead.', 'يوجد حساب بهذا البريد الإلكتروني. جرّب تسجيل الدخول بدلًا من ذلك.'],
  email_taken: ['An account with this email already exists.', 'يوجد حساب بهذا البريد الإلكتروني.'],
  login_failed: ['Email or password is incorrect.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
  already_account: ['This account already has a login.', 'لهذا الحساب بيانات دخول بالفعل.'],
  guest_no_password: ['Guest accounts do not have a password yet.', 'حسابات الضيوف ليس لها كلمة مرور بعد.'],
  current_password_wrong: ['Current password is incorrect.', 'كلمة المرور الحالية غير صحيحة.'],
  password_wrong: ['Password is incorrect.', 'كلمة المرور غير صحيحة.'],
  program_unknown: ['Unknown program.', 'تخصص غير معروف.'],
  year_invalid: ['Year must be between 1 and 4.', 'يجب أن تكون السنة بين 1 و4.'],
  semester_invalid: ['Semester must be 1 or 2.', 'يجب أن يكون الفصل 1 أو 2.'],
  skill_not_found: ['Skill not found.', 'المهارة غير موجودة.'],
  checklist_invalid: ['Invalid checklist.', 'قائمة غير صالحة.'],
  status_unknown: ['Unknown status.', 'حالة غير معروفة.'],
  program_not_found: ['Program not found.', 'التخصص غير موجود.'],
  feedback_short: ['Please write a short message.', 'يُرجى كتابة رسالة قصيرة.'],
  rating_invalid: ['Rating must be between 1 and 5.', 'يجب أن يكون التقييم بين 1 و5.'],
  not_found: ['Not found.', 'غير موجود.'],
  bad_json: ['Invalid JSON.', 'بيانات غير صالحة.'],
  server_error: ['Something went wrong on our side. Please try again.', 'حدث خطأ من جهتنا. يُرجى المحاولة مجددًا.'],
  login_required: ['Please log in to continue.', 'يُرجى تسجيل الدخول للمتابعة.'],
  blocked: ['Request blocked.', 'تم حظر الطلب.'],
  too_many: ['Too many attempts. Please wait a few minutes and try again.', 'محاولات كثيرة. يُرجى الانتظار بضع دقائق ثم المحاولة مجددًا.'],
};

export function msg(lang, key) {
  const pair = MESSAGES[key];
  if (!pair) return key;
  return lang === 'ar' ? pair[1] : pair[0];
}
