(function () {
  var KUNCI = "sitta-stok-v1";
  var timerNotifikasi;
  function salin(data) {
    return JSON.parse(JSON.stringify(data));
  }
  function bacaStok() {
    try {
      return JSON.parse(localStorage.getItem(KUNCI)) || salin(SITTA_DATA.stok);
    } catch (e) {
      return salin(SITTA_DATA.stok);
    }
  }
  function formKosong() {
    return {
      kode: "",
      judul: "",
      kategori: "",
      upbjj: "",
      lokasiRak: "",
      harga: "",
      qty: "",
      safety: "",
      catatan: "",
    };
  }

  new Vue({
    el: "#app",
    data: {
      upbjjList: SITTA_DATA.upbjjList,
      kategoriList: SITTA_DATA.kategoriList,
      stok: bacaStok(),
      filter: {
        upbjj: "",
        kategori: "",
        diBawahSafety: false,
        kosong: false,
        sort: "judul",
      },
      formBaru: formKosong(),
      errors: {},
      pesanForm: "",
      notifikasi: "",
      tambahAktif: false,
      editAktif: false,
      editData: formKosong(),
      kodeAwal: "",
      pesanEdit: "",
    },
    computed: {
      kategoriTersedia: function () {
        var self = this;
        if (!this.filter.upbjj) return [];
        return this.kategoriList.filter(function (kategori) {
          return self.stok.some(function (item) {
            return (
              item.upbjj === self.filter.upbjj && item.kategori === kategori
            );
          });
        });
      },
      stokTampil: function () {
        var f = this.filter;
        var hasil = this.stok.filter(function (item) {
          return (
            (!f.upbjj || item.upbjj === f.upbjj) &&
            (!f.kategori || item.kategori === f.kategori) &&
            (!f.diBawahSafety || (item.qty < item.safety && item.qty > 0)) &&
            (!f.kosong || item.qty === 0)
          );
        });
        return hasil.slice().sort(function (a, b) {
          if (f.sort === "judul") return a.judul.localeCompare(b.judul, "id");
          return Number(a[f.sort]) - Number(b[f.sort]);
        });
      },
    },
    watch: {
      "filter.upbjj": function () {
        if (this.kategoriTersedia.indexOf(this.filter.kategori) === -1)
          this.filter.kategori = "";
      },
      stok: {
        deep: true,
        handler: function () {
          localStorage.setItem(KUNCI, JSON.stringify(this.stok));
        },
      },
    },
    methods: {
      statusStok: function (item) {
        if (item.qty === 0) return { teks: "Kosong", kelas: "kosong" };
        if (item.qty < item.safety)
          return { teks: "Menipis", kelas: "menipis" };
        return { teks: "Aman", kelas: "aman" };
      },
      angkaValid: function (nilai) {
        return (
          nilai !== "" && Number.isFinite(Number(nilai)) && Number(nilai) >= 0
        );
      },
      validasi: function (data, kodeLama) {
        var wajib = ["kode", "judul", "kategori", "upbjj", "lokasiRak"];
        for (var i = 0; i < wajib.length; i++)
          if (!String(data[wajib[i]] || "").trim())
            return "Field " + wajib[i] + " wajib diisi.";
        if (
          this.stok.some(function (item) {
            return (
              item.kode.toLowerCase() === data.kode.toLowerCase() &&
              item.kode !== kodeLama
            );
          })
        )
          return "Kode bahan ajar sudah digunakan.";
        for (var j = 0; j < ["harga", "qty", "safety"].length; j++)
          if (!this.angkaValid(data[["harga", "qty", "safety"][j]]))
            return "Harga, jumlah stok, dan safety stock harus angka tidak negatif.";
        return "";
      },
      normalisasi: function (data) {
        return {
          kode: data.kode.trim(),
          judul: data.judul.trim(),
          kategori: data.kategori,
          upbjj: data.upbjj,
          lokasiRak: data.lokasiRak.trim(),
          harga: Number(data.harga),
          qty: Number(data.qty),
          safety: Number(data.safety),
          catatanHTML: data.catatan ? data.catatan.trim() : "",
        };
      },
      formatAngka: function (nilai) {
        if (nilai === "" || nilai === null || typeof nilai === "undefined") return "";
        return String(nilai).replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      },
      setHarga: function (data, nilai) {
        data.harga = nilai.replace(/\D/g, "");
      },
      tampilkanNotifikasi: function (pesan) {
        var self = this;
        clearTimeout(timerNotifikasi);
        this.notifikasi = pesan;
        timerNotifikasi = setTimeout(function () {
          self.notifikasi = "";
        }, 3000);
      },
      bukaTambah: function () {
        this.errors = {};
        this.pesanForm = "";
        this.formBaru = formKosong();
        this.tambahAktif = true;
      },
      tutupTambah: function () {
        this.tambahAktif = false;
        this.pesanForm = "";
      },
      tambahStok: function () {
        this.errors = {};
        this.pesanForm = "";
        var error = this.validasi(this.formBaru, "");
        if (error) {
          this.pesanForm = error;
          if (error.indexOf("Kode") !== -1) this.errors.kode = error;
          return;
        }
        this.stok.push(this.normalisasi(this.formBaru));
        this.formBaru = formKosong();
        this.tambahAktif = false;
        this.tampilkanNotifikasi("Bahan ajar berhasil ditambahkan.");
      },
      mulaiEdit: function (item) {
        this.editAktif = true;
        this.kodeAwal = item.kode;
        this.pesanEdit = "";
        this.editData = {
          kode: item.kode,
          judul: item.judul,
          kategori: item.kategori,
          upbjj: item.upbjj,
          lokasiRak: item.lokasiRak,
          harga: item.harga,
          qty: item.qty,
          safety: item.safety,
          catatan: item.catatanHTML.replace(/<[^>]*>/g, ""),
        };
      },
      simpanEdit: function () {
        var error = this.validasi(this.editData, this.kodeAwal);
        if (error) {
          this.pesanEdit = error;
          return;
        }
        var index = this.stok.findIndex(function (item) {
          return item.kode === this.kodeAwal;
        }, this);
        this.stok.splice(index, 1, this.normalisasi(this.editData));
        this.editAktif = false;
        this.tampilkanNotifikasi("Perubahan stok berhasil disimpan.");
      },
      batalEdit: function () {
        this.editAktif = false;
        this.pesanEdit = "";
      },
      resetFilter: function () {
        this.filter = {
          upbjj: "",
          kategori: "",
          diBawahSafety: false,
          kosong: false,
          sort: "judul",
        };
      },
    },
  });
})();
