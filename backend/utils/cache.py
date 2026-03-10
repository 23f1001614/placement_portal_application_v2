from flask_caching import Cache

cache = Cache()


def init_cache(app):
    cache_config = {
        'CACHE_TYPE': app.config.get('CACHE_TYPE', 'RedisCache'),
        'CACHE_REDIS_URL': app.config.get('CACHE_REDIS_URL', 'redis://localhost:6379/0'),
        'CACHE_DEFAULT_TIMEOUT': app.config.get('CACHE_DEFAULT_TIMEOUT', 300),
        'CACHE_KEY_PREFIX': 'ppa_'
    }
    cache.init_app(app, config=cache_config)
    return cache


def _get_redis_client():
    try:
        import redis
        from flask import current_app
        url = current_app.config.get('CACHE_REDIS_URL', 'redis://localhost:6379/0')
        return redis.from_url(url)
    except Exception:
        return None


def cache_key_jobs(search='', company='', skills='', page=1):
    return f"jobs:{search}:{company}:{skills}:{page}"


def cache_key_company(company_id):
    return f"company:{company_id}"


def cache_key_student(student_id):
    return f"student:{student_id}"


def invalidate_job_cache():
    try:
        r = _get_redis_client()
        if r:
            keys = r.keys('ppa_jobs:*') + r.keys('ppa_view//api/jobs*')
            if keys:
                r.delete(*keys)
    except Exception:
        pass


def invalidate_company_cache(company_id=None):
    try:
        if company_id:
            cache.delete(cache_key_company(company_id))
        r = _get_redis_client()
        if r:
            keys = r.keys('ppa_company:*') + r.keys('ppa_view//api/admin/companies*')
            if keys:
                r.delete(*keys)
    except Exception:
        pass


def invalidate_student_cache(student_id=None):
    try:
        if student_id:
            cache.delete(cache_key_student(student_id))
        r = _get_redis_client()
        if r:
            keys = r.keys('ppa_student:*') + r.keys('ppa_view//api/admin/students*')
            if keys:
                r.delete(*keys)
    except Exception:
        pass


def invalidate_all_search_caches():
    invalidate_job_cache()
    invalidate_company_cache()
    invalidate_student_cache()
