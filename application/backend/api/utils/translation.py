from deep_translator import GoogleTranslator

def translate_text(text, source_lang, target_lang):
    """
    Translate text from source language to target language.
    
    Args:
        text: The text to translate
        source_lang: Source language code (e.g., 'en', 'tr')
        target_lang: Target language code (e.g., 'en', 'tr', 'ar', 'es', 'fr')
    
    Returns:
        Translated text or original text if translation fails
    """
    if not text or source_lang == target_lang:
        return text
    
    try:
        translated = GoogleTranslator(source=source_lang, target=target_lang).translate(text)
        return translated
    except Exception as e:
        # If translation fails, return original text
        print(f"Translation error: {str(e)}")
        return text

def get_requested_language(request):
    """
    Get the requested language from the request.
    Checks query parameter 'lang' or Accept-Language header.
    
    Args:
        request: Django request object
    
    Returns:
        Language code (e.g., 'en', 'tr', 'ar', 'es', 'fr') or None
    """
    # First check query parameter
    lang = request.query_params.get('lang') if hasattr(request, 'query_params') else request.GET.get('lang')
    
    if lang and lang in ['en', 'tr', 'ar', 'es', 'fr']:
        return lang
    
    # Check Accept-Language header
    accept_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
    if accept_language:
        # Parse the first language from Accept-Language header
        primary_lang = accept_language.split(',')[0].split('-')[0].lower()
        if primary_lang in ['en', 'tr', 'ar', 'es', 'fr']:
            return primary_lang
    
    return None
