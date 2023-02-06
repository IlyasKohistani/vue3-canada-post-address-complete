<template>
    <form>
        <div class="row">
            <div class="col-md-12">
                <div class="form-group">
                    <label class="form-control-label">{{ $t('Address') + ' *' }}</label>
                    <address-search-input v-model="model.line"  :invalid="invalid" :countryCode="model.country" :populateDetail="true" @update-address-detail="updateAddressDetail" @update-country-code="code => {model.country = code; updateAddressDetail()}"/>
                </div>
            </div>
            <div class="col-md-12">
                <div class="form-group">
                    <label class="form-control-label">{{ $t('Line2') }}</label>
                    <input type="text" v-model="model.line2" class="form-control" :name="$t('Line2')" :placeholder="$t('Line2')">
                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-control-label">{{ $t('City') }}</label>
                    <input type="text" v-model="model.city" class="form-control" :name="$t('City')" :placeholder="$t('City')">
                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-control-label">{{ $t('Province') + ' *' }}</label>
                    <select class="form-control" v-bind:class="{'is-invalid': invalid}" v-model="model.province" @change="updateAddressDetail()">
                        <option v-for="province in provinceOptions" :value="province.value" :key="province.value">{{ province.text }}</option>
                    </select>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-control-label">{{ $t('Country') + ' *' }}</label>
                    <select class="form-control" v-bind:class="{'is-invalid': invalid}" v-model="model.country" @change="updateAddressDetail()">
                        <option v-for="country in countriesForDropdown" :value="country.value" :key="country.value">{{ country.text }}</option>
                    </select>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="form-group">
                    <label class="form-control-label">{{ $t('Postal Code') }}</label>
                    <input type="text" v-model="model.postal_code" class="form-control" :name="$t('Postal Code')" :placeholder="$t('Postal Code')">
                </div>
            </div>
        </div>
    </form>
</template>
<script>
import {reactive, computed} from "vue";
import iso3166Lookup from "iso3166-lookup";
import { State }  from 'country-state-city';
import AddressSearchInput from "@/components/AddressSearchInput";

export default {
    name: 'AddressForm',
    components:{
        AddressSearchInput,
    },
    setup() {
        const model = reactive({
                line: '',
                line2: '',
                country: '',
                province: '',
                city: '',
                postal_code: '',
            })
        
        const countries = reactive(iso3166Lookup.getAllCountries())
            
		const countriesForDropdown = computed(() => {
			return countries.map(country => {
				return {
					text: country.country,
					value: country.alpha3
				}
			})
		})
		const provinceOptions = computed(() => {
			const countryByAlpha3 = iso3166Lookup.findAlpha3(model?.country || '')
			if (model.country && countryByAlpha3) {
				return State.getStatesOfCountry(countryByAlpha3.alpha2).map(state => {
					return {
						text: state.name,
						value: state.isoCode
					}
				})
			}
            return []
		})

        const updateAddressDetail = (details = null) => {
            // reset selected address on country change
            if(!details) model.line = ''
            // update country from detail or set it to itself when country changed
            model.country = details?.CountryIso3 || model.country
            // update details
            model.province = ''
            if(details?.ProvinceCode){
                // since our state database is out of date we need to match isoCode or Province name
                let matchedProvince = provinceOptions.value.find(item => item.value == details.ProvinceCode || item.text.toLowerCase().includes(details.ProvinceName.toLowerCase()))
                if(matchedProvince) model.province = matchedProvince.value
            }
            model.city = details?.City || ''
            model.postal_code = details?.PostalCode || ''
            model.line2 = details?.Line2 || ''
        }

        return {
			countries,
			iso3166Lookup,
            model,
            countriesForDropdown,
            provinceOptions,
            updateAddressDetail
        }
    },
};
</script>
